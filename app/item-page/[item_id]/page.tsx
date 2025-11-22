import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ItemPageClient from './item-page-client';

type ListingImage = {
  listing_image_id: number;
  listing_id: number;
  storage: {
    base64: string;
    name: string;
    type: string;
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
    .select('*')
    .eq('listing_id', item_id)
    .order('sort_order', { ascending: true });

  // Convert base64 images to data URLs
  const imageUrls = images && !imagesError
    ? images.map((img: ListingImage) => {
        const storage = img.storage;
        if (storage && storage.base64) {
          return `data:${storage.type || 'image/jpeg'};base64,${storage.base64}`;
        }
        return null;
      }).filter(Boolean) as string[]
    : [];

  const listingData = listing as Listing;

  return (
    <ItemPageClient
      listing={{
        id: listingData.listing_id.toString(),
        title: listingData.title || 'Untitled Listing',
        price: listingData.price_cents ? listingData.price_cents / 100 : 0,
        priceFormatted: formatPrice(listingData.price_cents, listingData.currency),
        description: listingData.description || '',
        condition: formatCondition(listingData.condition),
        quantity: listingData.quantity || 0,
        dateListed: listingData.created_at
          ? new Date(listingData.created_at).toLocaleDateString()
          : 'Unknown',
        imageUrls: imageUrls.length > 0 ? imageUrls : [],
        category: 'Category', // TODO: Add category lookup if you have category_id
      }}
    />
  );
}
