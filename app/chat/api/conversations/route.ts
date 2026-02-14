import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Fetch all conversations where user is either buyer or seller
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversation')
      .select(`
        conversation_id,
        listing_id,
        buyer_id,
        seller_id,
        created_at,
        listing:listing_id (
          title,
          price_cents
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (conversationsError) {
      console.error('Error fetching conversations:', conversationsError);
      return NextResponse.json(
        { success: false, error: conversationsError.message },
        { status: 500 }
      );
    }

    // For each conversation, fetch the last message
    const conversationsWithMessages = await Promise.all(
      (conversations || []).map(async (conv: {
        conversation_id: string;
        listing_id: number;
        buyer_id: string;
        seller_id: string;
        created_at: string;
        listing: { title: string; price_cents: number } | null;
      }) => {
        const { data: lastMessage } = await supabase
          .from('message')
          .select('text, created_at')
          .eq('conversation_id', conv.conversation_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        // Determine user's role in this conversation
        const user_role = conv.buyer_id === userId ? 'buyer' : 'seller';

        // Parse last message if it's JSON (special message types)
        let lastMessageText = lastMessage?.text || null;
        if (lastMessageText) {
          try {
            const parsed = JSON.parse(lastMessageText);
            if (parsed.type === 'confirmation') {
              lastMessageText = 'Sent a confirmation request';
            } else if (parsed.type === 'confirmation_accepted') {
              lastMessageText = 'Sale confirmed';
            } else if (parsed.type === 'confirmation_declined') {
              lastMessageText = 'Confirmation declined';
            } else if (parsed.type === 'item_sold') {
              lastMessageText = 'Item has been sold';
            } else if (parsed.type === 'confirmation_response') {
              lastMessageText = `Response: ${parsed.response === 'yes' ? 'Yes' : 'No'}`;
            }
          } catch {
            // Not JSON, use as-is
          }
        }

        return {
          conversation_id: conv.conversation_id,
          listing_id: conv.listing_id,
          listing_title: conv.listing?.title || 'Untitled Listing',
          listing_price_cents: conv.listing?.price_cents || 0,
          buyer_id: conv.buyer_id,
          seller_id: conv.seller_id,
          user_role,
          last_message: lastMessageText,
          last_message_time: lastMessage?.created_at || null,
          created_at: conv.created_at,
        };
      })
    );

    // Sort by last message time (most recent first)
    conversationsWithMessages.sort((a, b) => {
      if (!a.last_message_time && !b.last_message_time) return 0;
      if (!a.last_message_time) return 1;
      if (!b.last_message_time) return -1;
      return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
    });

    return NextResponse.json({
      success: true,
      conversations: conversationsWithMessages,
    });
  } catch (error) {
    console.error('Unexpected error in GET /chat/api/conversations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
