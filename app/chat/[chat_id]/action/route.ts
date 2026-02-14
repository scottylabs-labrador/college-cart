import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json();
    const text = body.text;
    const user = body.user_id;
    const chat = body.chat_id;
    const messageType = body.message_type || "text";
    const confirmationData = body.confirmation_data;
    const confirmationResponseTo = body.confirmation_response_to;
    const confirmationResponse = body.confirmation_response;

    // Handle confirmation response (yes/no) — special flow
    if (messageType === 'confirmation_response' && confirmationResponseTo) {
      // Get the conversation to find the listing_id
      const { data: conversation, error: convError } = await supabase
        .from('conversation')
        .select('conversation_id, listing_id')
        .eq('conversation_id', chat)
        .single();

      if (convError || !conversation) {
        return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
      }

      // Look up the original confirmation message to get date/location/price
      const { data: originalMsg, error: msgError } = await supabase
        .from('message')
        .select('text')
        .eq('message_id', confirmationResponseTo)
        .single();

      if (msgError || !originalMsg) {
        return NextResponse.json({ success: false, error: 'Original confirmation message not found' }, { status: 404 });
      }

      let originalConfirmation: { date?: string; location?: string; price?: string } = {};
      try {
        const parsed = JSON.parse(originalMsg.text);
        if (parsed.type === 'confirmation') {
          originalConfirmation = { date: parsed.date, location: parsed.location, price: parsed.price };
        }
      } catch {
        const dateMatch = originalMsg.text.match(/Date: (.+)/);
        const locationMatch = originalMsg.text.match(/Location: (.+)/);
        const priceMatch = originalMsg.text.match(/Price: (.+)/);
        originalConfirmation = {
          date: dateMatch?.[1],
          location: locationMatch?.[1],
          price: priceMatch?.[1],
        };
      }

      if (confirmationResponse === 'yes') {
        // 1. Update listing status to "inactive"
        const { error: listingUpdateError } = await supabase
          .from('listing')
          .update({ status: 'sold' })
          .eq('listing_id', conversation.listing_id);

        if (listingUpdateError) {
          console.error('Error updating listing status:', listingUpdateError);
          return NextResponse.json({ success: false, error: 'Failed to update listing status' }, { status: 500 });
        }

        // 2. Insert confirmation_accepted message into current conversation
        const { error: acceptedMsgError } = await supabase
          .from('message')
          .insert([{
            user: user,
            text: JSON.stringify({
              type: 'confirmation_accepted',
              date: originalConfirmation.date,
              location: originalConfirmation.location,
              price: originalConfirmation.price,
              response_to: confirmationResponseTo,
            }),
            conversation_id: chat,
            message_type: 'text',
          }]);

        if (acceptedMsgError) {
          console.error('Error inserting accepted message:', acceptedMsgError);
          return NextResponse.json({ success: false, error: 'Failed to send acceptance' }, { status: 500 });
        }

        // 3. Insert item_sold messages into all OTHER conversations for the same listing
        const { data: otherConversations, error: otherConvError } = await supabase
          .from('conversation')
          .select('conversation_id')
          .eq('listing_id', conversation.listing_id)
          .neq('conversation_id', chat);

        if (!otherConvError && otherConversations && otherConversations.length > 0) {
          const soldMessages = otherConversations.map((conv) => ({
            user: 'system',
            text: JSON.stringify({ type: 'item_sold' }),
            conversation_id: conv.conversation_id,
            message_type: 'text',
          }));

          const { error: soldMsgError } = await supabase
            .from('message')
            .insert(soldMessages);

          if (soldMsgError) {
            console.error('Error inserting sold messages:', soldMsgError);
            // Non-critical — don't fail the whole request
          }
        }

        return NextResponse.json({ success: true });

      } else {
        // "No" response — insert confirmation_declined message
        const { error: declinedMsgError } = await supabase
          .from('message')
          .insert([{
            user: user,
            text: JSON.stringify({
              type: 'confirmation_declined',
              response_to: confirmationResponseTo,
            }),
            conversation_id: chat,
            message_type: 'text',
          }]);

        if (declinedMsgError) {
          console.error('Error inserting declined message:', declinedMsgError);
          return NextResponse.json({ success: false, error: 'Failed to send decline' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }
    }

    // Store confirmation data as JSON string in text field if it's a confirmation message
    // Use "text" as message_type since the enum doesn't support "confirmation"
    let messageText = text;
    const actualMessageType = "text";
    
    if (messageType === 'confirmation' && confirmationData) {
      messageText = JSON.stringify({
        type: 'confirmation',
        date: confirmationData.date,
        location: confirmationData.location,
        price: confirmationData.price,
        displayText: `Confirmation Request:\nDate: ${confirmationData.date}\nLocation: ${confirmationData.location}\nPrice: ${confirmationData.price}`,
      });
    }

    const messagePayload: {
      user: string;
      text: string;
      conversation_id: string;
      message_type: string;
    } = {
      user: user,
      text: messageText,
      conversation_id: chat,
      message_type: actualMessageType,
    };

    const { data: insertData, error: insertError } = await supabase
      .from('message')
      .insert([messagePayload])
      .select('message_id')
      .single()

    if (insertError) {
      console.error('Error sending message:', insertError)
      let errorMessage = insertError.message
      if (insertError.code === '23502') {
        errorMessage = `Missing required field: ${insertError.message}`
      } else if (insertError.code === '23503') {
        errorMessage = `Invalid reference: ${insertError.message}`
      } else if (insertError.code === '23505') {
        errorMessage = `Duplicate entry: ${insertError.message}`
      }
      return NextResponse.json({ success: false, error: errorMessage, details: insertError }, { status: 500 })
    }

    const messageId = insertData?.message_id
    return NextResponse.json({ success: true, message_id: messageId ?? null });
    
  } catch (error) {
    console.error('Unexpected error in POST /chat/action:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}
