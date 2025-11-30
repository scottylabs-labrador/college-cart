import React from "react";
import Link from "next/link";
import {
  Search as SearchIcon,
  ShoppingCart,
  Menu,
  Sparkles,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { createClient } from "@/lib/supabase/server";
import HomeClient from "./home-client";

/* ---------------- DATA ---------------- */

const HERO_TILES = [
  {
    id: "furniture",
    eyebrow: "Shelves, Cabinets, Storage",
    title: "Furniture",
    href: "/c?c=1&n=Furniture",
    image:
      "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "appliances",
    eyebrow: "Refrigerators, microwaves",
    title: "Appliances",
    href: "/c?c=2&n=Appliances",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "studysupplies",
    eyebrow: "Laptops, headphones, monitors",
    title: "Textbooks & Study Supplies",
    href: "/c?c=3&n=Study%20Supplies",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
  },
];

const SMALL_TILES = [
  {
    eyebrow: "Laptops, monitors",
    title: "Electronics",
    href: "/c?c=4&n=Electronics",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Merch, jackets, formal wear",
    title: "Clothing",
    href: "/c?c=5&n=Clothing",
    image:
      "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?q=80&w=1000&auto=format&fit=crop",
  },
  {
    eyebrow: "Bikes, scooters",
    title: "Commute",
    href: "/c?c=6&n=Commute",
    image:
      "https://images.unsplash.com/photo-1544531585-9847c3227f84?q=80&w=1000&auto=format&fit=crop",
  },
  {
    eyebrow: "Giveaways, art, tickets",
    title: "Free & Fun",
    href: "/c?c=7&n=Free%20%26%20Fun",
    image:
      "https://images.unsplash.com/photo-1544531585-9847c3227f84?q=80&w=1000&auto=format&fit=crop",
  },
];

/* ---------------- TILE COMPONENT ---------------- */

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
  // Same height for all cards within a row
  const cardHeight = hero ? "h-[320px]" : "h-[240px]"; // adjust to taste
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
        {/* Eyebrow + See more */}
        <div className="flex items-start justify-between">
          <p className="text-[15px] text-slate-700 leading-5 max-w-[75%]">
            {eyebrow}
          </p>
          <span className="text-sm underline underline-offset-4 whitespace-nowrap">
            See more
          </span>
        </div>

        {/* Title (clamp to at most 2 lines to keep heights uniform) */}
        <h3 className={`${titleSize} text-slate-900 mt-1 line-clamp-2`}>
          {title}
        </h3>

        {/* Image fills the remaining space; no aspect box so it won't overflow */}
        <div className="mt-3 flex-1 rounded-md bg-white/40 overflow-hidden">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>
      </Card>
    </Link>
  );
}

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

export const dynamic = "force-dynamic";

/* ---------------- PAGE ---------------- */

export default async function CollegeCartHome() {
  const supabase = await createClient();

  // Fetch recent listings (limit to 8 for the "See what's selling" section)
  const { data: listings, error } = await supabase
    .from("listing")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  // Fetch images for each listing
  const listingsWithImages = await Promise.all(
    (listings || []).map(async (listing: Listing) => {
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

  return <HomeClient listings={listingsWithImages} />;
}
