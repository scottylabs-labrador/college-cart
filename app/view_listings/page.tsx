import Link from "next/link";
import { Card } from "@/components/ui/card";
import MainHeader from "@/components/main-header";
import { createClient } from "@/lib/supabase/server";

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
  listing_id: number | string;
  seller_id: number | string;
  category_id: number | string | null;
  title: string | null;
  description: string | null;
  price_cents: number | null;
  currency: string | null;
  condition: string | null;
  quantity: number | null;
  status: string | null;
  location: Record<string, unknown> | string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ListingDisplay = {
  id: string;
  title: string;
  priceFormatted: string;
  imageUrl: string;
  href: string;
};

const defaultCurrency = "USD";

function formatPrice(priceCents: number | null, currency: string | null) {
  if (priceCents === null) return "—";

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

export default async function ViewListingsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const supabase = await createClient();
  searchParams = await searchParams;
  const searchTerm =  (searchParams?.search ?? "").trim();

  const baseQuery = supabase
    .from("listing")
    .select("*")
    .order("created_at", { ascending: false });

  let listingsData: Listing[] = [];
  let errorMessage: string | null = null;

  if (searchTerm) {
    const { data, error } = await supabase.rpc("fuzzy_search_listings", {
      search: searchTerm,
    });
    listingsData = (data ?? []) as Listing[];
    errorMessage = error?.message ?? null;
  } else {
    const { data, error } = await baseQuery;
    listingsData = (data ?? []) as Listing[];
    errorMessage = error?.message ?? null;
  }

  const listingsWithImages: ListingDisplay[] = await Promise.all(
    listingsData.map(async (listing) => {
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
          imageUrl = `data:${img.storage.type || "image/jpeg"};base64,${
            img.storage.base64
          }`;
        }
      }

      return {
        id: listing.listing_id.toString(),
        title: listing.title || "Untitled listing",
        priceFormatted: formatPrice(listing.price_cents, listing.currency),
        imageUrl: imageUrl || "/scotty-tote-dummy.jpg",
        href: `/item-page/${listing.listing_id}`,
      };
    })
  );

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <MainHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          {searchTerm
            ? `Showing results for "${searchTerm}".`
            : "Browse every item currently available in CollegeCart."}
        </p>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Could not load listings. Please refresh the page or try again later.
          </div>
        ) : listingsWithImages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {searchTerm
              ? "No items matched that search. Try a different keyword."
              : "No listings yet. Once sellers post items they will appear here."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {listingsWithImages.map((listing) => (
              <Link
                key={listing.id}
                href={listing.href}
                className="group block transition-transform duration-200 hover:scale-[1.02]"
              >
                <Card className="overflow-hidden rounded-xl border-0 bg-white shadow-sm">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="mb-2 line-clamp-2 text-sm font-semibold text-slate-900">
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
  );
}
