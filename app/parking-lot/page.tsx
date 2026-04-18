'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth-client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, FileEdit, Pencil, RotateCcw, Trash2, Upload } from 'lucide-react';
import MainHeader from '@/components/main-header';
import RequireLogin from '@/components/require_login';
import { getImageUrlsBatch } from '@/lib/image-utils';
import { isRemoteImageSrc } from '@/lib/storage-image';
import posthog from 'posthog-js';

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
  status: 'draft' | 'archived';
};

function formatPrice(priceCents: number | null, currency: string | null) {
  if (priceCents === null || priceCents === 0) return 'No price yet';
  const code = currency?.toUpperCase() ?? 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
    }).format(priceCents / 100);
  } catch {
    return `${priceCents / 100} ${code}`;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
);

export default function ParkingLotPage() {
  const { isLoaded, userId } = useAuth();
  const [listings, setListings] = useState<ListingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    const { data: rows, error } = await supabase
      .from('listing')
      .select('*')
      .eq('seller_id', userId)
      .in('status', ['draft', 'archived'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching parking lot listings:', error);
      setIsLoading(false);
      return;
    }

    const typed = (rows ?? []) as Listing[];
    const ids = typed.map((l) => l.listing_id);

    const { data: allImages } = await supabase
      .from('listing_image')
      .select('image_id, listing_id, sort_order, storage')
      .in('listing_id', ids.length > 0 ? ids : [-1])
      .order('sort_order', { ascending: true });

    const imageByListing = new Map<number, { storage: { url?: string; type?: string; key?: string } }>();
    for (const img of allImages || []) {
      if (!imageByListing.has(img.listing_id)) {
        imageByListing.set(img.listing_id, img);
      }
    }

    const storageObjects = typed.map((l) => imageByListing.get(l.listing_id)?.storage);
    const imageUrls = await getImageUrlsBatch(storageObjects);

    const mapped: ListingDisplay[] = typed.map((listing, i) => ({
      id: listing.listing_id.toString(),
      title: listing.title || 'Untitled Draft',
      price: listing.price_cents ? listing.price_cents / 100 : 0,
      priceFormatted: formatPrice(listing.price_cents, listing.currency),
      imageUrl: imageUrls[i] || '/scotty-tote-dummy.jpg',
      status: (listing.status === 'archived' ? 'archived' : 'draft'),
    }));

    setListings(mapped);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings]);

  const runAction = async (
    listing: ListingDisplay,
    action: 'publish' | 'unarchive' | 'archive',
    confirmMessage?: string,
  ) => {
    if (!userId) return;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setPendingId(listing.id);
    try {
      const formData = new FormData();
      formData.append('listing_id', listing.id);
      formData.append('user_id', userId);
      formData.append('action', action);

      const res = await fetch('/parking-lot/action', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        alert(result.error || 'Action failed.');
        return;
      }
      posthog.capture(`listing_${action}ed`, { listing_id: listing.id });
      await fetchListings();
    } catch (err) {
      console.error('Parking lot action failed:', err);
      alert('Network error. Please try again.');
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (listing: ListingDisplay) => {
    if (!userId) return;
    if (!window.confirm('Delete this listing permanently? This cannot be undone.')) return;
    setPendingId(listing.id);
    try {
      const formData = new FormData();
      formData.append('listing_id', listing.id);
      formData.append('user_id', userId);
      const res = await fetch(`/item-page/${listing.id}/delete`, {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        alert(result.error || 'Failed to delete listing.');
        return;
      }
      posthog.capture('listing_deleted', { listing_id: listing.id, source: 'parking_lot' });
      await fetchListings();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Network error. Please try again.');
    } finally {
      setPendingId(null);
    }
  };

  if (!isLoaded || !userId) {
    return <RequireLogin />;
  }

  const drafts = listings.filter((l) => l.status === 'draft');
  const archived = listings.filter((l) => l.status === 'archived');

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MainHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Parking Lot</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Your drafts and archived listings live here. Drafts aren&apos;t public until you
              publish them; archived listings are hidden from other users but can be reposted.
            </p>
          </div>
          <Link href="/post-item">
            <Button className="bg-[#2f167a] hover:bg-[#241057] text-white">
              <FileEdit className="w-4 h-4 mr-2" />
              New Draft
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 text-slate-700 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f167a]" />
            <p className="text-sm">Loading your Parking Lot...</p>
          </div>
        ) : (
          <>
            <Section
              title="Drafts"
              emptyMessage="You have no drafts yet. Start a listing and save it to Parking Lot to come back later."
              items={drafts}
              renderActions={(listing) => (
                <>
                  <Button
                    size="sm"
                    className="flex-1 bg-[#4a2db8] hover:bg-[#3d2599] text-white"
                    disabled={pendingId === listing.id}
                    onClick={() =>
                      runAction(
                        listing,
                        'publish',
                        'Publish this draft? It will become visible to other users.',
                      )
                    }
                  >
                    <Upload className="w-4 h-4 mr-1.5" />
                    Publish
                  </Button>
                  <Link href={`/edit-item/${listing.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      <Pencil className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={pendingId === listing.id}
                    onClick={() => handleDelete(listing)}
                    aria-label="Delete draft"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            />

            <Section
              title="Archived"
              emptyMessage="You have no archived listings. Archive an active listing from its page to store it here."
              items={archived}
              renderActions={(listing) => (
                <>
                  <Button
                    size="sm"
                    className="flex-1 bg-[#4a2db8] hover:bg-[#3d2599] text-white"
                    disabled={pendingId === listing.id}
                    onClick={() =>
                      runAction(
                        listing,
                        'unarchive',
                        'Repost this listing so other users can see it again?',
                      )
                    }
                  >
                    <RotateCcw className="w-4 h-4 mr-1.5" />
                    Repost
                  </Button>
                  <Link href={`/edit-item/${listing.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">
                      <Pencil className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    disabled={pendingId === listing.id}
                    onClick={() => handleDelete(listing)}
                    aria-label="Delete archived listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            />
          </>
        )}
      </main>
    </div>
  );
}

type SectionProps = {
  title: string;
  items: ListingDisplay[];
  emptyMessage: string;
  renderActions: (listing: ListingDisplay) => React.ReactNode;
};

function Section({ title, items, emptyMessage, renderActions }: SectionProps) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        {title === 'Drafts' ? (
          <FileEdit className="w-5 h-5 text-[#2f167a]" />
        ) : (
          <Archive className="w-5 h-5 text-[#2f167a]" />
        )}
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-sm text-slate-500">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-10 text-slate-600 border border-dashed rounded-xl">
          <p className="text-sm max-w-md mx-auto">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((listing) => (
            <Card
              key={listing.id}
              className="rounded-xl border shadow-sm overflow-hidden bg-white"
            >
              <div className="aspect-square relative bg-muted overflow-hidden">
                <Image
                  src={listing.imageUrl}
                  alt={listing.title}
                  fill
                  unoptimized={
                    isRemoteImageSrc(listing.imageUrl) || listing.imageUrl.startsWith('data:')
                  }
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <span className="absolute top-2 left-2 bg-white/90 text-[#2f167a] text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide">
                  {listing.status}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-slate-900 line-clamp-2 mb-1 text-sm">
                  {listing.title}
                </h3>
                <p className="text-sm text-slate-600 mb-3">{listing.priceFormatted}</p>
                <div className="flex items-center gap-2">{renderActions(listing)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
