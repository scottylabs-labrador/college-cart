'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import MainHeader from "@/components/main-header";
import RequireLogin from "@/components/require_login";

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
    return (
      <div className="text-center py-12 text-slate-600">
        <p>{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((listing) => (
        <Link
          key={listing.id}
          href={listing.href}
          className="group block transition-transform duration-200 hover:scale-[1.02]"
        >
          <Card className="rounded-xl border-0 shadow-sm overflow-hidden bg-white">
            <div className="aspect-square relative bg-muted overflow-hidden">
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                  listing.status === 'sold' ? 'opacity-60' : ''
                }`}
              />
              {listing.status === 'sold' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    SOLD
                  </span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 text-sm">
                {listing.title}
              </h3>
              <p className={`text-lg font-bold ${listing.status === 'sold' ? 'text-slate-400' : 'text-[#2f167a]'}`}>
                {listing.priceFormatted}
              </p>
            </div>
          </Card>
        </Link>
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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error accessing listings:", error);
        setIsLoading(false);
        return;
      }

      const listingsWithImages = await Promise.all(
        (listingsData || []).map(async (listing: Listing) => {
          const { data: images } = await supabase
            .from("listing_image")
            .select("*")
            .eq("listing_id", listing.listing_id)
            .order("sort_order", { ascending: true })
            .limit(1);

          let imageUrl = null;
          if (images && images.length > 0) {
            const img = images[0] as ListingImage;
            if (img.storage && img.storage.base64) {
              imageUrl = `data:${img.storage.type || "image/jpeg"};base64,${img.storage.base64}`;
            }
          }

          return {
            id: listing.listing_id.toString(),
            title: listing.title || "Untitled Listing",
            price: listing.price_cents ? listing.price_cents / 100 : 0,
            priceFormatted: formatPrice(listing.price_cents, listing.currency),
            imageUrl: imageUrl || "/scotty-tote-dummy.jpg",
            href: `/item-page/${listing.listing_id}`,
            status: listing.status || 'active',
          };
        })
      );

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
    <div className="min-h-screen bg-white text-slate-900">
      <MainHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">
        {isLoading ? (
          <div className="flex items-center gap-3 text-slate-700 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f167a]" />
            <p className="text-sm">Loading your listings...</p>
          </div>
        ) : (
          <>
            {/* Items for Sale */}
            <div>
              <p className="text-xl font-medium pt-4 mb-6">Items for Sale</p>
              <ListingGrid
                items={activeListings}
                emptyMessage="You don't have any active listings."
              />
            </div>

            {/* Sold Items */}
            <div>
              <p className="text-xl font-medium pt-4 mb-6">Sold Items</p>
              <ListingGrid
                items={soldListings}
                emptyMessage="You haven't sold any items yet."
              />
            </div>
          </>
        )}
      </main>

      <footer className="border-t mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-sm text-slate-600 flex items-center gap-3">
          <Clock className="h-4 w-4" />
          Updated just now • CMU College Cart beta
        </div>
      </footer>
    </div>
  );
}
