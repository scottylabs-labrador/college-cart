import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditItemClient from './edit-item-client';
import { s3, BUCKET } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extractObjectKey, safePublicImageUrl } from '@/lib/storage-image';

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
    .select('image_id, listing_id, sort_order, storage')
    .eq('listing_id', item_id)
    .order('sort_order', { ascending: true });

  const existingImages: { id: string; url: string }[] = [];
  if (images && !imagesError) {
    for (const img of images as { image_id: number; storage: { url?: string; key?: string; type?: string } }[]) {
      const storage = img.storage;
      if (!storage) continue;

      let imageUrl = '';

      const key = extractObjectKey(storage);

      if (key) {
        try {
          imageUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: BUCKET, Key: key }),
            { expiresIn: 3600 }
          );
        } catch (e) {
          console.error("Failed to generate presigned URL on server for", key, e);
        }
      }

      if (!imageUrl) {
        imageUrl = safePublicImageUrl(storage) ?? '';
      }

      if (imageUrl) {
        existingImages.push({
          id: img.image_id.toString(),
          url: imageUrl,
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
