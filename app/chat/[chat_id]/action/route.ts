import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json();
    const text = body.text;
    const user = body.user_id;
    const chat = body.chat_id;

    const { data: listingData, error: listingError } = await supabase
      .from('message')
      .insert([{ user: user, text: text, conversation_id: chat, message_type: "text" }])
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
