import { createClient } from '@/lib/supabase/server';

function getMessageType(text: string): string | null {
  try {
    const parsed = JSON.parse(text) as { type?: string };
    return typeof parsed.type === 'string' ? parsed.type : null;
  } catch {
    return null;
  }
}

function getPreviewText(text: string): string | null {
  const messageType = getMessageType(text);

  if (!messageType) return text;

  if (
    messageType === 'confirmation_accepted' ||
    messageType === 'confirmation_declined' ||
    messageType === 'item_sold' ||
    messageType === 'confirmation_response'
  ) {
    return null;
  }

  if (messageType === 'confirmation') {
    return 'Sent a confirmation request';
  }

  return text;
}

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
    (conversations || []).map(async (conv) => {
      const c = conv as {
        conversation_id: string;
        listing_id: number;
        buyer_id: string;
        seller_id: string;
        created_at: string;
        listing: { title: string; price_cents: number }[] | { title: string; price_cents: number } | null;
      };
      // Supabase may return the joined listing as an array or a single object
      const listing = Array.isArray(c.listing) ? c.listing[0] : c.listing;

      const { data: messages } = await supabase
        .from('message')
        .select('text, created_at, user')
        .eq('conversation_id', c.conversation_id)
        .order('created_at', { ascending: false })
        .limit(30);

      const user_role = (c.buyer_id === userId ? 'buyer' : 'seller') as 'buyer' | 'seller';
      const hasAcceptedSale = (messages || []).some((message) => getMessageType(message.text) === 'confirmation_accepted');
      const deal_status = hasAcceptedSale ? (user_role === 'buyer' ? 'bought' : 'sold') : null;

      const previewMessage = (messages || []).find((message) => getPreviewText(message.text) !== null);
      const lastMessageText = previewMessage ? getPreviewText(previewMessage.text) : null;

      return {
        conversation_id: c.conversation_id,
        listing_id: c.listing_id,
        listing_title: listing?.title || 'Untitled Listing',
        listing_price_cents: listing?.price_cents || 0,
        buyer_id: c.buyer_id,
        seller_id: c.seller_id,
        user_role,
        deal_status,
        last_message: lastMessageText,
        last_message_time: previewMessage?.created_at || null,
        last_message_sender: previewMessage?.user || null,
        created_at: c.created_at,
      };
    })
  );

  const nonEmptyConversations = conversationsWithMessages.filter(
    (conv) => conv.last_message !== null
  );

  nonEmptyConversations.sort((a, b) => {
    if (!a.last_message_time && !b.last_message_time) return 0;
    if (!a.last_message_time) return 1;
    if (!b.last_message_time) return -1;
    return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
  });

  return nonEmptyConversations;
}
