import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData();
    const listing_id = formData.get('listing_id') as string
    const user_id = formData.get('user_id') as string
    let added = false;

    const { data, error: favoriteError } = await supabase
      .from('favorite')
      .select('*')
      .eq('user_id', user_id)
      .eq('listing_id', listing_id)
      .maybeSingle();

    if (data) {
      added = true;
      await supabase
          .from('favorite')
          .delete()
          .eq('user_id', user_id)
          .eq('listing_id', listing_id);
      } else {
        added = false;
        await supabase
            .from('favorite')
            .insert({ user_id: user_id, listing_id: listing_id });
        }

    if (favoriteError) {
      console.error('Error adding to favorites:', favoriteError)
      // Provide more descriptive error messages
      let errorMessage = favoriteError.message
      if (favoriteError.code === '23502') {
        errorMessage = `Missing required field: ${favoriteError.message}`
      } else if (favoriteError.code === '23503') {
        errorMessage = `Invalid reference: ${favoriteError.message}`
      } else if (favoriteError.code === '23505') {
        errorMessage = `Duplicate favorite: ${favoriteError.message}`
      }
      return NextResponse.json({ success: false, error: errorMessage, details: favoriteError }, { status: 500 })
    }

    if(added){
      const favoriteId = data?.id
      return NextResponse.json({ success: true, favorite_id: favoriteId ?? null });
    }
    else{
      return NextResponse.json({ success: true, favorite_id: 1 });
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
