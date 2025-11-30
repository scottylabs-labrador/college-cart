import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData();
    const listing_id = formData.get('listing_id') as string
    const user_id = formData.get('buyer_id') as string
    const seller_id = formData.get('seller_id') as string

    const { data: conversationData, error: conversationError } = await supabase
      .from('conversation')
      .upsert([{ listing_id: listing_id, buyer_id: user_id, seller_id: seller_id}, 
       ],  {onConflict: "seller_id,buyer_id,listing_id"})
      .select('conversation_id')
      .single()

    if (conversationError) {
      console.error('Error creating conversation:', conversationError)
      // Provide more descriptive error messages
      let errorMessage = conversationError.message
      if (conversationError.code === '23502') {
        errorMessage = `Missing required field: ${conversationError.message}`
      } else if (conversationError.code === '23503') {
        errorMessage = `Invalid reference: ${conversationError.message}`
      } else if (conversationError.code === '23505') {
        errorMessage = `Duplicate conversation: ${conversationError.message}`
      }
      return NextResponse.json({ success: false, error: errorMessage, details: conversationError }, { status: 500 })
    }

    const conversationId = conversationData?.conversation_id
    return NextResponse.json({ success: true, conversation_id: conversationId ?? null });
    
  } catch (error) {
    console.error('Unexpected error in POST /item-page/[item_id]/action:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}
