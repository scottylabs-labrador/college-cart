"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import MainHeader from "@/components/main-header";
import posthog from "posthog-js";

type ListingItem = {
  id: string;
  title: string;
  price: number;
  priceFormatted: string;
  imageUrl: string;
  href: string;
};

export default function CategoryClient({ listings, name }: { listings: ListingItem[], name: string }) {
  const hasTrackedBrowse = useRef(false);

  // Track category browsed event (top of conversion funnel)
  useEffect(() => {
    if (!hasTrackedBrowse.current) {
      hasTrackedBrowse.current = true;
      posthog.capture('category_browsed', {
        category_name: name,
        listings_count: listings.length,
      });
    }
  }, [name, listings.length]);

  const handleListingClick = (listing: ListingItem) => {
    posthog.capture('listing_clicked', {
      listing_id: listing.id,
      listing_title: listing.title,
      price: listing.price,
      source: 'category_page',
      category_name: name,
    });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <MainHeader />

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
                  onClick={() => handleListingClick(listing)}
                >
                  <Card className="rounded-xl border-0 shadow-sm overflow-hidden bg-white">
                    <div className="aspect-square relative bg-muted overflow-hidden">
                      <Image
                        src={listing.imageUrl}
                        alt={listing.title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
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
