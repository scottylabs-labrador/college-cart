import { createClient } from '@/lib/supabase/server';

export async function getConversations(userId: string) {
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
    return [];
  }

  // Process conversations to get last messages
  // (This is the same logic you had in your API route)
  const conversationsWithMessages = await Promise.all(
    (conversations || []).map(async (conv: any) => {
      const { data: lastMessage } = await supabase
        .from('message')
        .select('text, created_at')
        .eq('conversation_id', conv.conversation_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const user_role = (conv.buyer_id === userId ? 'buyer' : 'seller') as 'buyer' | 'seller';
      
      // JSON parsing logic for confirmations...
      let lastMessageText = lastMessage?.text || null;
      if (lastMessageText) {
          try {
            const parsed = JSON.parse(lastMessageText);
            if (parsed.type === 'confirmation') {
              lastMessageText = 'Sent a confirmation request';
            } else if (parsed.type === 'confirmation_response') {
              lastMessageText = `Response: ${parsed.response === 'yes' ? 'Yes' : 'No'}`;
            }
          } catch { /* Not JSON, use as-is */ }
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

  // Sort by last message time
  conversationsWithMessages.sort((a, b) => {
    if (!a.last_message_time && !b.last_message_time) return 0;
    if (!a.last_message_time) return 1;
    if (!b.last_message_time) return -1;
    return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
  });

  return conversationsWithMessages;
}