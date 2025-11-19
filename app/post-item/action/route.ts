import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()

    const title = formData.get('title') as string
    const seller_id = formData.get('user_id') as string
    const description = formData.get('description') as string
    const priceValue = formData.get('price_cents') as string
    const condition = formData.get('condition') as string
    const quantityValue = formData.get('quantity') as string
    const status = formData.get('status') as string
    const location = formData.get('location') as string | null
    const imageEntries = formData.getAll('images')
    const imageFiles = imageEntries.filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    )

    // Validation
    if (!title || title.trim() === '') {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }
    if (!description || description.trim() === '') {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 })
    }
    if (!seller_id || seller_id.trim() === '') {
      return NextResponse.json({ success: false, error: 'User ID is required. Please make sure you are logged in.' }, { status: 400 })
    }
    if (!condition || condition.trim() === '') {
      return NextResponse.json({ success: false, error: 'Condition is required' }, { status: 400 })
    }

    const parsedPrice = priceValue ? parseInt(priceValue, 10) : null
    const price_cents = Number.isNaN(parsedPrice) ? null : parsedPrice
    
    if (!price_cents || price_cents <= 0) {
      return NextResponse.json({ success: false, error: 'Price must be greater than 0' }, { status: 400 })
    }

    const parsedQuantity = quantityValue ? parseInt(quantityValue, 10) : null
    const quantity = Number.isNaN(parsedQuantity) ? null : parsedQuantity
    
    if (!quantity || quantity <= 0) {
      return NextResponse.json({ success: false, error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    const { data: listingData, error: listingError } = await supabase
      .from('listing')
      .insert([{ title, seller_id, description, price_cents, condition, quantity, status, location }])
      .select('listing_id')
      .single()

    if (listingError) {
      console.error('Error inserting listing:', listingError)
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
        return NextResponse.json({ 
          success: false, 
          error: `Failed to upload images: ${imageError.message}`,
          details: imageError 
        }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, listing_id: listingId })
  } catch (error) {
    console.error('Unexpected error in POST /post-item/action:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}
