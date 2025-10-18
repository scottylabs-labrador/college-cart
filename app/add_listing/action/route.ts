import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const formData = await request.formData()

  const title = formData.get('title') as string
  const seller_id = 0 // change after implementing auth
  const description = formData.get('description') as string
  const price_cents = parseInt(formData.get('price_cents') as string)
  const condition = formData.get('condition') as string
  const quantity = formData.get('quantity') as string
  const status = formData.get('status') as string
  const location = formData.get('location') as string

  // Insert into Supabase table
  const { error } = await supabase.from('listing').insert([{ title, seller_id, description, price_cents, condition, quantity, status, location }])

  if (error) {
    console.error('Error inserting data:', error)
    return NextResponse.json({ success: false, error: error.message })
  }

  return NextResponse.json({ success: true })
}
