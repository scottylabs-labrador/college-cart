import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditItemClient from './edit-item-client';

export const dynamic = 'force-dynamic';

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ item_id: string }>;
}) {
  const { item_id } = await params;
  const supabase = await createClient();

  // Fetch listing data
  const { data: listing, error: listingError } = await supabase
    .from('listing')
    .select('*')
    .eq('listing_id', item_id)
    .single();

  if (listingError || !listing) {
    notFound();
  }

  // Fetch listing images
  const { data: images, error: imagesError } = await supabase
    .from('listing_image')
    .select('*')
    .eq('listing_id', item_id)
    .order('sort_order', { ascending: true });

  const existingImages: { id: string; url: string }[] = [];
  if (images && !imagesError) {
    for (const img of images as { listing_image_id: string; storage?: { base64?: string; type?: string } }[]) {
      const storage = img.storage;
      if (storage && storage.base64) {
        existingImages.push({
          id: img.listing_image_id,
          url: `data:${storage.type || 'image/jpeg'};base64,${storage.base64}`,
        });
      }
    }
  }

  return (
    <EditItemClient
      listing={{
        id: listing.listing_id.toString(),
        seller_id: listing.seller_id.toString(),
        title: listing.title || '',
        price: listing.price_cents ? (listing.price_cents / 100).toString() : '',
        description: listing.description || '',
        condition: listing.condition || '',
        quantity: listing.quantity?.toString() || '1',
        category: listing.category_id,
        existingImages,
      }}
    />
  );
}
