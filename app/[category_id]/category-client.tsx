"use client";

import { useEffect, useRef } from "react";
import { ListingCard, LISTING_GRID } from "@/components/listing-card";
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
    <div className="flex-1 bg-white text-slate-900">
      <MainHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-3xl font-semibold">{name}</h1>
        {listings.length === 0 ? (
          <p className="py-12 text-center text-slate-600">
            No items in this category yet. Be the first one to upload!
          </p>
        ) : (
          <div className={LISTING_GRID}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} onClick={() => handleListingClick(listing)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
