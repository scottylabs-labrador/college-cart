"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Menu,
  Sparkles,
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

type ListingItem = {
  id: string;
  title: string;
  price: number;
  priceFormatted: string;
  imageUrl: string;
  href: string;
};

export default function CategoryClient({ listings, name }: { listings: ListingItem[], name: string }) {
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
              <Link href="/chat" className="hidden md:flex"> 
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

        {/* See what's selling section */}
        <div>
          <p className="text-xl font-medium pt-4 mb-6">{name}</p>
          {listings.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <p>No items in this category yet. Be the first one to upload!</p>
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
