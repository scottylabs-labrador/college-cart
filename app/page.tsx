"use client";

import React, { useState } from "react";
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

/* ---------------- DATA ---------------- */

const HERO_TILES = [
  {
    id: "furniture",

    eyebrow: "Shelves, Cabinets, Storage",
    title: "Furniture",
    href: "/c/furniture",
    image:
      "https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "appliances",
    eyebrow: "Refrigerators, microwaves",
    title: "Appliances",
    href: "/c/appliances",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "studysupplies",
    eyebrow: "Laptops, headphones, monitors",
    title: "Textbooks & Study Supplies",
    href: "/c/study-materials",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
  },
];

const SMALL_TILES = [
  {
    eyebrow: "Laptops, monitors",
    title: "Electronics",
    href: "/c/electronics",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
  },
  {
    eyebrow: "Merch, jackets, formal wear",
    title: "Clothing",
    href: "/c/clothing",
    image:
      "https://images.unsplash.com/photo-1521335629791-ce4aec67dd47?q=80&w=1000&auto=format&fit=crop",
  },
  {
    eyebrow: "Bikes, scooters",
    title: "Commute",
    href: "/c/commute",
    image:
      "https://images.unsplash.com/photo-1544531585-9847c3227f84?q=80&w=1000&auto=format&fit=crop",
  },
  {
    eyebrow: "Giveaways, art, tickets",
    title: "Free & Fun",
    href: "/c/free",
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

/* ---------------- PAGE ---------------- */

export default function CollegeCartHome() {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="bg-[#2f167a] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3">
              <Menu className="h-6 w-6 md:hidden" />
              <Link href="/" className="flex items-center gap-2">
                <div className="h-9 w-9 bg-white/10 grid place-items-center rounded-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <span className="text-xl font-semibold">CollegeCart</span>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl items-center gap-2">
              <div className="relative w-full">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-80" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search CollegeCart"
                  className="pl-10 h-11 rounded-full bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton />
                <SignUpButton>
                  <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <Link href="/cart" className="hidden md:flex">
                <ShoppingCart className="h-6 w-6" />
              </Link>
              <Link href="/post-item">
                <Button className="bg-white text-[#2f167a] rounded-xl px-6">
                  Sell
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

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

        <p className="text-xl font-medium pt-4">See what's selling</p>
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
