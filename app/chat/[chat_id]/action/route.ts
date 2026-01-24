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

    // Store confirmation data as JSON string in text field if it's a confirmation message
    // Use "text" as message_type since the enum doesn't support "confirmation"
    let messageText = text;
    let actualMessageType = "text";
    
    if (messageType === 'confirmation' && confirmationData) {
      messageText = JSON.stringify({
        type: 'confirmation',
        date: confirmationData.date,
        location: confirmationData.location,
        price: confirmationData.price,
        displayText: `Confirmation Request:\nDate: ${confirmationData.date}\nLocation: ${confirmationData.location}\nPrice: ${confirmationData.price}`,
      });
      actualMessageType = "text"; // Use "text" for enum compatibility
    } else if (messageType === 'confirmation_response' && confirmationResponseTo) {
      messageText = JSON.stringify({
        type: 'confirmation_response',
        response_to: confirmationResponseTo,
        response: confirmationResponse,
        displayText: `Response: ${confirmationResponse === 'yes' ? 'Yes' : 'No'}`,
      });
      actualMessageType = "text"; // Use "text" for enum compatibility
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

    const { data: listingData, error: listingError } = await supabase
      .from('message')
      .insert([messagePayload])
      .select('message_id')
      .single()

    if (listingError) {
      console.error('Error sending message:', listingError)
      // Provide more descriptive error messages
      let errorMessage = listingError.message
      if (listingError.code === '23502') {
        errorMessage = `Missing required field: ${listingError.message}`
      } else if (listingError.code === '23503') {
        errorMessage = `Invalid reference: ${listingError.message}`
      } else if (listingError.code === '23505') {
        errorMessage = `Duplicate entry: ${listingError.message}`
      }
      return NextResponse.json({ success: false, error: errorMessage, details: listingError }, { status: 500 })
    }

    const messageId = listingData?.message_id
    return NextResponse.json({ success: true, message_id: messageId ?? null });
    
  } catch (error) {
    console.error('Unexpected error in POST /post-item/action:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}
