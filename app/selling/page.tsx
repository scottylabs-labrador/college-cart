'use client';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/lib/auth-client";
import MainHeader from "@/components/main-header";
import { ListingCard, LISTING_GRID } from "@/components/listing-card";
import { getImageUrlsBatch } from "@/lib/image-utils";
import RequireLogin from "@/components/require_login";


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
  created_at: string | null;
};

type ListingDisplay = {
  id: string;
  title: string;
  price: number;
  priceFormatted: string;
  imageUrl: string;
  href: string;
  status: string;
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

const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  key
);

function ListingGrid({ items, emptyMessage }: { items: ListingDisplay[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-slate-600">{emptyMessage}</p>;
  }
  return (
    <div className={LISTING_GRID}>
      {items.map((listing) => (
        <ListingCard key={listing.id} listing={listing} sold={listing.status === 'sold'} />
      ))}
    </div>
  );
}

export default function SellingPage() {
  const { userId, isLoaded } = useAuth();
  const [listings, setListings] = useState<ListingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      const { data: listingsData, error } = await supabase
        .from("listing")
        .select("*")
        .eq("seller_id", userId)
        .in("status", ["active", "sold"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error accessing listings:", error);
        setIsLoading(false);
        return;
      }

      const listings_ = listingsData || [];
      const listingIds = listings_.map((l: Listing) => l.listing_id);

      const { data: allImages } = await supabase
        .from("listing_image")
        .select("image_id, listing_id, sort_order, storage")
        .in("listing_id", listingIds)
        .order("sort_order", { ascending: true });

      const imageByListing = new Map<number, { storage: { url?: string; type?: string; key?: string } }>();
      for (const img of allImages || []) {
        if (!imageByListing.has(img.listing_id)) {
          imageByListing.set(img.listing_id, img);
        }
      }

      const storageObjects = listings_.map(
        (l: Listing) => imageByListing.get(l.listing_id)?.storage
      );
      const imageUrls = await getImageUrlsBatch(storageObjects);

      const listingsWithImages = listings_.map((listing: Listing, i: number) => ({
        id: listing.listing_id.toString(),
        title: listing.title || "Untitled Listing",
        price: listing.price_cents ? listing.price_cents / 100 : 0,
        priceFormatted: formatPrice(listing.price_cents, listing.currency),
        imageUrl: imageUrls[i] || "/scotty-tote-dummy.jpg",
        href: `/item-page/${listing.listing_id}`,
        status: listing.status || 'active',
      }));

      setListings(listingsWithImages);
      setIsLoading(false);
    };

    fetchListings();
  }, [isLoaded, userId]);

  if (!isLoaded || !userId) {
    return <RequireLogin />;
  }

  const activeListings = listings.filter((l) => l.status === 'active');
  const soldListings = listings.filter((l) => l.status === 'sold');

  return (
    <div className="flex-1 bg-white text-slate-900">
      <MainHeader />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold">On Sale</h1>
        {isLoading ? (
          <div className="flex items-center gap-3 py-8 text-slate-700">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
            <p className="text-sm">Loading your listings...</p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="mb-6 text-2xl">Items for Sale</h2>
              <ListingGrid
                items={activeListings}
                emptyMessage="You don't have any active listings."
              />
            </section>

            <section>
              <h2 className="mb-6 text-2xl">Sold Items</h2>
              <ListingGrid
                items={soldListings}
                emptyMessage="You haven't sold any items yet."
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
