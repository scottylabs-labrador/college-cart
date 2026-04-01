import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ItemPageClient from './item-page-client';

import { s3, BUCKET } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type ListingImage = {
  image_id: number;
  listing_id: number;
  storage: {
    url?: string;
    name: string;
    type: string;
    key?: string;
  };
  sort_order: number;
};

type Listing = {
  listing_id: number;
  seller_id: string;
  title: string | null;
  description: string | null;
  price_cents: number | null;
  currency: string | null;
  condition: string | null;
  quantity: number | null;
  status: string | null;
  location: Record<string, unknown> | string | null;
  created_at: string | null;
  updated_at: string | null;
};

function formatPrice(priceCents: number | null, currency: string | null) {
  if (priceCents === null) return "$0.00";
  const defaultCurrency = "USD";
  const code = currency?.toUpperCase() ?? defaultCurrency;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(priceCents / 100);
  } catch {
    return `${priceCents / 100} ${code}`;
  }
}

function formatCondition(condition: string | null) {
  if (!condition) return "Not specified";
  return condition
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const dynamic = 'force-dynamic';

export default async function ItemPage({
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


  // Fetch category names
  
  const { data: categoryName, error: categoryError } = await supabase
    .from('category')
    .select('*')
    .eq('id', listing.category_id)
    .single()
  
  if (categoryError) console.error("Couldn't fetch category name", categoryError);


  // Convert images to presigned URLs or use existing formats
  const imageUrls = images && !imagesError
    ? await Promise.all(
        images.map(async (img: ListingImage) => {
          const storage = img.storage;
          if (!storage) return null;

          // Check if it's a Tigris image
          const isTigrisUrl = storage.url?.includes("tigris.dev");
          const key = storage.key || (isTigrisUrl ? storage.url?.split(".dev/").pop() : null);

          if (key) {
            try {
              return await getSignedUrl(
                s3,
                new GetObjectCommand({ Bucket: BUCKET, Key: key }),
                { expiresIn: 3600 }
              );
            } catch (e) {
              console.error("Failed to generate presigned URL on server for", key, e);
            }
          }

          if (storage.url) {
            return storage.url;
          }
          return null;
        })
      )
    : [];
  
  const finalImageUrls = imageUrls.filter(Boolean) as string[];

  const listingData = listing as Listing;

  return (
    <ItemPageClient
      listing={{
        id: listingData.listing_id.toString(),
        seller_id: listingData.seller_id.toString(),
        title: listingData.title || 'Untitled Listing',
        price: listingData.price_cents ? listingData.price_cents / 100 : 0,
        priceFormatted: formatPrice(listingData.price_cents, listingData.currency),
        description: listingData.description || '',
        condition: formatCondition(listingData.condition),
        quantity: listingData.quantity || 0,
        dateListed: listingData.created_at
          ? new Date(listingData.created_at).toLocaleDateString()
          : 'Unknown',
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : [],
        category: categoryName?.category_name || 'Other',
      }}
    />
  );
}
