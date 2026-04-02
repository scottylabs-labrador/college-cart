import { createClient } from "@supabase/supabase-js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET } from "@/lib/s3";
import HomeClient from "./home-client";

export const revalidate = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type StorageObject = {
  url?: string;
  type?: string;
  key?: string;
};

const FALLBACK_IMAGE = "/scotty-tote-dummy.jpg";

function extractKey(storage: StorageObject | undefined | null): string | null {
  if (!storage) return null;
  const isTigrisUrl = storage.url?.includes("tigris.dev");
  return (
    storage.key ||
    (isTigrisUrl ? (storage.url?.split(".dev/").pop() ?? null) : null)
  );
}

async function resolveImageUrl(
  storage: StorageObject | undefined | null
): Promise<string> {
  if (!storage) return FALLBACK_IMAGE;

  const key = extractKey(storage);
  if (key) {
    try {
      return await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        { expiresIn: 3600 }
      );
    } catch (e) {
      console.error("Failed to generate presigned URL for", key, e);
    }
  }

  if (storage.url) return storage.url;
  return FALLBACK_IMAGE;
}

function formatPrice(priceCents: number | null, currency: string | null) {
  if (priceCents === null) return "$0.00";
  const code = currency?.toUpperCase() ?? "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
    }).format(priceCents / 100);
  } catch {
    return `${priceCents / 100} ${code}`;
  }
}

export default async function CollegeCartHome() {
  const { data, error } = await supabase
    .from("listing")
    .select("*, listing_image(image_id, listing_id, sort_order, storage)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading listings:", error);
  }

  const rawListings = data || [];

  const listings = await Promise.all(
    rawListings.map(async (listing) => {
      const images = (listing.listing_image || []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
      const imageUrl = await resolveImageUrl(images[0]?.storage);

      return {
        id: listing.listing_id.toString(),
        title: listing.title || "Untitled Listing",
        price: listing.price_cents ? listing.price_cents / 100 : 0,
        priceFormatted: formatPrice(listing.price_cents, listing.currency),
        imageUrl: imageUrl || FALLBACK_IMAGE,
        href: `/item-page/${listing.listing_id}`,
      };
    })
  );

  return <HomeClient listings={listings} />;
}
