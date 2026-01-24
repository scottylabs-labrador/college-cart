import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const listing_id = formData.get('listing_id') as string | null;
    const user_id = formData.get('user_id') as string | null;

    if (!listing_id || !user_id) {
      return NextResponse.json(
        { success: false, error: 'Missing listing_id or user_id.' },
        { status: 400 }
      );
    }

    const { data: listing, error: listingError } = await supabase
      .from('listing')
      .select('seller_id')
      .eq('listing_id', listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json(
        { success: false, error: listingError?.message || 'Listing not found.' },
        { status: 404 }
      );
    }

    if (listing.seller_id !== user_id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to delete this listing.' },
        { status: 403 }
      );
    }

    const { data: conversations, error: conversationLookupError } = await supabase
      .from('conversation')
      .select('conversation_id')
      .eq('listing_id', listing_id);

    if (conversationLookupError) {
      console.error('Error fetching conversations:', conversationLookupError);
      return NextResponse.json(
        { success: false, error: conversationLookupError.message, details: conversationLookupError },
        { status: 500 }
      );
    }

    const conversationIds = (conversations || []).map(
      (conversation) => conversation.conversation_id
    );

    if (conversationIds.length > 0) {
      const { error: messageDeleteError } = await supabase
        .from('message')
        .delete()
        .in('conversation_id', conversationIds);

      if (messageDeleteError) {
        console.error('Error deleting messages:', messageDeleteError);
        return NextResponse.json(
          { success: false, error: messageDeleteError.message, details: messageDeleteError },
          { status: 500 }
        );
      }
    }

    const { error: conversationDeleteError } = await supabase
      .from('conversation')
      .delete()
      .eq('listing_id', listing_id);

    if (conversationDeleteError) {
      console.error('Error deleting conversations:', conversationDeleteError);
      return NextResponse.json(
        { success: false, error: conversationDeleteError.message, details: conversationDeleteError },
        { status: 500 }
      );
    }

    const { error: favoriteDeleteError } = await supabase
      .from('favorite')
      .delete()
      .eq('listing_id', listing_id);

    if (favoriteDeleteError) {
      console.error('Error deleting favorites:', favoriteDeleteError);
      return NextResponse.json(
        { success: false, error: favoriteDeleteError.message, details: favoriteDeleteError },
        { status: 500 }
      );
    }

    const { error: imageDeleteError } = await supabase
      .from('listing_image')
      .delete()
      .eq('listing_id', listing_id);

    if (imageDeleteError) {
      console.error('Error deleting listing images:', imageDeleteError);
      return NextResponse.json(
        { success: false, error: imageDeleteError.message, details: imageDeleteError },
        { status: 500 }
      );
    }

    const { error: listingDeleteError } = await supabase
      .from('listing')
      .delete()
      .eq('listing_id', listing_id);

    if (listingDeleteError) {
      console.error('Error deleting listing:', listingDeleteError);
      return NextResponse.json(
        { success: false, error: listingDeleteError.message, details: listingDeleteError },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in POST /item-page/[item_id]/delete:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
