"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search as SearchIcon,
  ShoppingCart,
  Menu,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
 UserButton,
} from "@clerk/nextjs";
import SearchBar from "@/components/search-bar";

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

type ListingItem = {
  id: string;
  title: string;
  price: number;
  priceFormatted: string;
  imageUrl: string;
  href: string;
};

export default function HomeClient({ listings }: { listings: ListingItem[] }) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="bg-[#2f167a] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3">
              <Menu className="h-6 w-6 md:hidden" />
              <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-blue.png"
                alt="CollegeCart Logo"
                width={60}
                height={60}
                className="object-contain"
              />
              <span className="font-semibold text-lg">CollegeCart</span>
            </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl items-center gap-2">
              <SearchBar
                placeholder="Search CollegeCart"
                className="w-full"
                inputClassName="pl-10 h-11 rounded-full bg-white text-slate-900"
                iconClassName="h-5 w-5 opacity-80 text-slate-500"
              />
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

        {/* See what's selling section */}
        <div>
          <p className="text-xl font-medium pt-4 mb-6">See what's selling</p>
          {listings.length === 0 ? (
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

