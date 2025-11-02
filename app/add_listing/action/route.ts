import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const formData = await request.formData()

  const title = formData.get('title') as string
  const seller_id = formData.get('user_id') as string
  const description = formData.get('description') as string
  const priceValue = formData.get('price_cents') as string
  const condition = formData.get('condition') as string
  const quantityValue = formData.get('quantity') as string
  const status = formData.get('status') as string
  const location = formData.get('location') as string
  const imageEntries = formData.getAll('images')
  const imageFiles = imageEntries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0
  )

  const parsedPrice = priceValue ? parseInt(priceValue, 10) : null
  const price_cents = Number.isNaN(parsedPrice) ? null : parsedPrice

  const parsedQuantity = quantityValue ? parseInt(quantityValue, 10) : null
  const quantity = Number.isNaN(parsedQuantity) ? null : parsedQuantity

  const { data: listingData, error: listingError } = await supabase
    .from('listing')
    .insert([{ title, seller_id, description, price_cents, condition, quantity, status, location }])
    .select('listing_id')
    .single()

  if (listingError) {
    console.error('Error inserting listing:', listingError)
    return NextResponse.json({ success: false, error: listingError.message }, { status: 500 })
  }

  const listingId = listingData?.listing_id
  if (!listingId) {
    console.error('Listing insert did not return an id')
    return NextResponse.json({ success: false, error: 'Listing ID missing after insert.' }, { status: 500 })
  }

  if (imageFiles.length > 0) {
    const imagesPayload = await Promise.all(
      imageFiles.map(async (file, index) => {
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')

        return {
          listing_id: listingId,
          storage: {
            name: file.name,
            type: file.type,
            size: file.size,
            base64,
            encoding: 'base64',
          },
          sort_order: index,
        }
      })
    )

    const { error: imageError } = await supabase.from('listing_image').insert(imagesPayload)

    if (imageError) {
      console.error('Error inserting listing images:', imageError)
      return NextResponse.json({ success: false, error: imageError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
