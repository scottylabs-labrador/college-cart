"use client";

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

type FavoriteClientProps = {
  listings: ListingItem[];
  title?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  loadingMessage?: string;
};

export default function FavoriteClient({
  listings,
  title = "Favorited Items",
  emptyMessage = "No favorited items yet. Go like some items!",
  isLoading = false,
  loadingMessage = "Loading items...",
}: FavoriteClientProps) {
  return (
    <div className="flex-1 bg-white text-slate-900">
      <MainHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="mb-6 text-3xl font-semibold">{title}</h1>
        {isLoading ? (
          <div className="flex items-center gap-3 py-8 text-slate-700">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
            <p className="text-sm">{loadingMessage}</p>
          </div>
        ) : listings.length === 0 ? (
          <p className="py-12 text-center text-slate-600">{emptyMessage}</p>
        ) : (
          <div className={LISTING_GRID}>
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} unoptimized />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
