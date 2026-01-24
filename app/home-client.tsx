"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Card } from "@/components/ui/card";
import MainHeader from "@/components/main-header";

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

type ListingItem = {
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

const HERO_TILES = [
  {
    id: "furniture",
    eyebrow: "Shelves, Cabinets, Storage",
    title: "Furniture",
    href: "/c?c=1&n=Furniture",
    image:
      "/furniture.png",
  },
  {
    id: "appliances",
    eyebrow: "Refrigerators, microwaves",
    title: "Appliances",
    href: "/c?c=2&n=Appliances",
    image:
      "/essentials.png",
  },
  {
    id: "studysupplies",
    eyebrow: "Laptops, headphones, monitors",
    title: "Textbooks & Study Supplies",
    href: "/c?c=3&n=Study%20Supplies",
    image:
      "/books.png",
  },
];

const SMALL_TILES = [
  {
    eyebrow: "Laptops, monitors",
    title: "Electronics",
    href: "/c?c=4&n=Electronics",
    image:
      "/electronics.png",
  },
  {
    eyebrow: "Merch, jackets, formal wear",
    title: "Clothing",
    href: "/c?c=5&n=Clothing",
    image:
      "/clothing.png",
  },
  {
    eyebrow: "Bikes, scooters",
    title: "Commute",
    href: "/c?c=6&n=Commute",
    image:
      "/commute.png",
  },
  {
    eyebrow: "Giveaways, art, tickets",
    title: "Free & Fun",
    href: "/c?c=7&n=Free%20%26%20Fun",
    image:
      "/tickets.png",
  },
];

function TileCard({
  eyebrow,
  title,
  image,
  href,
  hero = false,
}: {
  eyebrow: string;
  title: string;
  image: string;
  href: string;
  hero?: boolean;
}) {
  const cardHeight = hero ? "h-[320px]" : "h-[240px]";
  const titleSize = hero
    ? "text-[34px] font-semibold leading-tight"
    : "text-[26px] font-semibold leading-tight";

  return (
    <Link
      href={href}
      className="block transition-transform duration-200 hover:scale-[1.03]"
    >
      <Card
        className={`rounded-2xl border-0 shadow-sm bg-violet-100 p-6 flex flex-col overflow-hidden ${cardHeight}`}
      >
        <div className="flex items-start justify-between">
          <p className="text-[15px] text-slate-700 leading-5 max-w-[75%]">
            {eyebrow}
          </p>
          <span className="text-sm underline underline-offset-4 whitespace-nowrap">
            See more
          </span>
        </div>
        <h3 className={`${titleSize} text-slate-900 mt-1 line-clamp-2`}>
          {title}
        </h3>
        <div className="mt-3 flex-1 rounded-md bg-white/40 overflow-hidden">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>
      </Card>
    </Link>
  );
}

export default function HomeClient() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchListings = async () => {
      setIsLoading(true);
      try {
        const { data: listingsData, error } = await supabase
          .from("listing")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) {
          console.error("Error loading listings:", error);
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

        if (isActive) {
          setListings(listingsWithImages);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchListings();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <MainHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">
        {/* Top 3 tiles */}
        <section className="grid md:grid-cols-3 gap-6">
          {HERO_TILES.map((tile) => (
            <TileCard key={tile.id} {...tile} hero />
          ))}
        </section>

        {/* Bottom 4 tiles */}
        <section className="grid md:grid-cols-4 gap-6">
          {SMALL_TILES.map((tile) => (
            <TileCard key={tile.title} {...tile} />
          ))}
        </section>

        {/* See what's selling section */}
        <div>
          <p className="text-xl font-medium pt-4 mb-6">See what's selling</p>
          {isLoading ? (
            <div className="flex items-center gap-3 text-slate-700 py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f167a]" />
              <p className="text-sm">Loading items...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <p>No items for sale yet. Be the first to list something!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {listings.map((listing) => (
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
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 line-clamp-2 mb-2 text-sm">
                        {listing.title}
                      </h3>
                      <p className="text-lg font-bold text-[#2f167a]">
                        {listing.priceFormatted}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 text-sm text-slate-600 flex items-center gap-3">
          <Clock className="h-4 w-4" />
          Updated just now • CMU College Cart beta
        </div>
      </footer>
    </div>
  );
}
