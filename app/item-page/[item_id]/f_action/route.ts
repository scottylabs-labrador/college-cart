import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData();
    const listing_id = formData.get('listing_id') as string
    const user_id = formData.get('user_id') as string
    let added = false;

    // Check if favorite already exists
    const { data: existingFavorites, error: checkError } = await supabase
      .from('favorite')
      .select('id')
      .eq('user_id', user_id)
      .eq('listing_id', listing_id);

    if (checkError) {
      console.error('Error checking favorite:', checkError)
      return NextResponse.json({ success: false, error: checkError.message, details: checkError }, { status: 500 })
    }

    const existingFavorite = existingFavorites && existingFavorites.length > 0 ? existingFavorites[0] : null;

    if (existingFavorite) {
      // Favorite exists, so we're removing it (unliking)
      const { error: deleteError } = await supabase
          .from('favorite')
          .delete()
          .eq('user_id', user_id)
          .eq('listing_id', listing_id);

      if (deleteError) {
        console.error('Error deleting favorite:', deleteError)
        return NextResponse.json({ success: false, error: deleteError.message, details: deleteError }, { status: 500 })
      }

      return NextResponse.json({ success: true, favorite_id: null, liked: false });
    } else {
      // Favorite doesn't exist, so we're adding it (liking)
      const { data: newFavorite, error: insertError } = await supabase
          .from('favorite')
          .insert({ user_id: user_id, listing_id: listing_id })
          .select('id');

      if (insertError) {
        console.error('Error inserting favorite:', insertError)
        // Provide more descriptive error messages
        let errorMessage = insertError.message
        if (insertError.code === '23502') {
          errorMessage = `Missing required field: ${insertError.message}`
        } else if (insertError.code === '23503') {
          errorMessage = `Invalid reference: ${insertError.message}`
        } else if (insertError.code === '23505') {
          errorMessage = `Duplicate favorite: ${insertError.message}`
        }
        return NextResponse.json({ success: false, error: errorMessage, details: insertError }, { status: 500 })
      }

      // Handle case where insert returns 0 or multiple rows
      if (!newFavorite || newFavorite.length === 0) {
        console.error('Insert succeeded but no data returned')
        return NextResponse.json({ success: false, error: 'Failed to create favorite - no data returned' }, { status: 500 })
      }

      // Get the first row if multiple are returned (shouldn't happen, but handle it)
      const favoriteId = Array.isArray(newFavorite) ? newFavorite[0]?.id : newFavorite?.id;

      return NextResponse.json({ success: true, favorite_id: favoriteId ?? null, liked: true });
    }
    
  } catch (error) {
    console.error('Unexpected error in POST /item-page/[item_id]/f_action:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}
