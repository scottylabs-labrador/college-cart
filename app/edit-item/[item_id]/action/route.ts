import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPostHogClient } from '@/lib/posthog-server'
import { uploadImage } from '@/lib/storage'

export async function POST(request: Request, { params }: { params: Promise<{ item_id: string }> }) {
  try {
    const { item_id } = await params;
    const supabase = await createClient()
    const formData = await request.formData()

    const title = formData.get('title') as string
    const user_id = formData.get('user_id') as string
    const description = formData.get('description') as string
    const priceValue = formData.get('price_cents') as string
    const condition = formData.get('condition') as string
    const quantityValue = formData.get('quantity') as string
    const category = formData.get('category') as string
    const retainedImageIds = formData.getAll('retained_image_ids').map(id => parseInt(id as string, 10))
    const imageEntries = formData.getAll('images')
    const newImageFiles = imageEntries.filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    )

    // Validation
    if (!title || title.trim() === '') {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }
    if (!description || description.trim() === '') {
      return NextResponse.json({ success: false, error: 'Description is required' }, { status: 400 })
    }
    if (!user_id || user_id.trim() === '') {
      return NextResponse.json({ success: false, error: 'User ID is required. Please make sure you are logged in.' }, { status: 400 })
    }
    if (!condition || condition.trim() === '') {
      return NextResponse.json({ success: false, error: 'Condition is required' }, { status: 400 })
    }
    const category_id = parseInt(category);
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

    // Check ownership
    const { data: existingListing, error: fetchError } = await supabase
      .from('listing')
      .select('seller_id')
      .eq('listing_id', item_id)
      .single()

    if (fetchError || !existingListing) {
       return NextResponse.json({ success: false, error: 'Listing not found.' }, { status: 404 })
    }

    if (existingListing.seller_id !== user_id) {
       return NextResponse.json({ success: false, error: 'Not authorized to edit this listing.' }, { status: 403 })
    }

    // Update listing
    const { error: updateError } = await supabase
      .from('listing')
      .update({ title, category_id, description, price_cents, condition, quantity })
      .eq('listing_id', item_id)

    if (updateError) {
      console.error('Error updating listing:', updateError)
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    // Handle images: delete un-retained images
    if (retainedImageIds.length > 0) {
       await supabase
         .from('listing_image')
         .delete()
         .eq('listing_id', item_id)
         .not('image_id', 'in', `(${retainedImageIds.join(',')})`)
    } else {
       await supabase.from('listing_image').delete().eq('listing_id', item_id)
    }

    const newImageKeysJson = formData.get('new_image_keys') as string
    
    if (newImageKeysJson) {
      const newImageItems = JSON.parse(newImageKeysJson) as Array<{
        name: string,
        type: string,
        size: number,
        key: string
      }>

      if (newImageItems.length > 0) {
        // Find current max sort_order
        const { data: maxSortData } = await supabase
          .from('listing_image')
          .select('sort_order')
          .eq('listing_id', item_id)
          .order('sort_order', { ascending: false })
          .limit(1)

        const startSortOrder = maxSortData && maxSortData.length > 0 ? (maxSortData[0].sort_order as number) + 1 : 0

        const imagesPayload = newImageItems.map((item, index) => {
          return {
            listing_id: item_id,
            storage: {
              name: item.name,
              type: item.type,
              size: item.size,
              key: item.key,
              // Store the direct URL as a fallback
              url: `https://${process.env.S3_BUCKET}.fly.storage.tigris.dev/${item.key}`,
            },
            sort_order: startSortOrder + index,
          }
        })

        const { error: imageError } = await supabase.from('listing_image').insert(imagesPayload)

        if (imageError) {
          console.error('Error inserting listing images:', imageError)
          return NextResponse.json({
            success: false,
            error: `Failed to save new image references: ${imageError.message}`,
            details: imageError
          }, { status: 500 })
        }
      }
    }

    // Track listing edited event (server-side)
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: user_id,
      event: 'listing_edited_server',
      properties: {
        listing_id: item_id,
        category_id: category_id,
        condition: condition,
        price_cents: price_cents,
        quantity: quantity,
      }
    });

    return NextResponse.json({ success: true, listing_id: item_id })
  } catch (error) {
    console.error('Unexpected error in POST /edit-item/[item_id]/action:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}
