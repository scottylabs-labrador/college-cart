'use client';

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import FavoriteClient from "../cart/favorite-client";
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
  "https://dkmaapjiqiqyxbjyshky.supabase.co",
  key
);

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

  return (
    <FavoriteClient
      listings={listings}
      title="Items for Sale"
      emptyMessage="You haven't listed any items yet."
      isLoading={isLoading}
    />
  );
}
