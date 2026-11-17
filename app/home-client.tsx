"use client";

import { CategoryGrid } from "@/components/category-tiles";
import { ListingCard, LISTING_GRID } from "@/components/listing-card";
import MainHeader from "@/components/main-header";

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
    <div className="flex-1 bg-white text-slate-900">
      <MainHeader />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
        <CategoryGrid />

        <section>
          <h2 className="mb-6 text-2xl">See what&apos;s selling</h2>
          {listings.length === 0 ? (
            <p className="py-12 text-center text-slate-600">
              No items for sale yet. Be the first to list something!
            </p>
          ) : (
            <div className={LISTING_GRID}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
