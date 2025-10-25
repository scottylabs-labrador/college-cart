
import Link from "next/link";
import Search from "./search"

import { createClient } from "@/lib/supabase/server";


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

function formatLocation(location: Listing["location"]) {
  if (!location) return "Not provided";
  if (typeof location === "string") return location;

  if (Array.isArray(location)) {
    const compact = location
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter(Boolean);
    if (compact.length > 0) {
      return compact.join(", ");
    }
  }

  if (typeof location === "object") {
    const values = Object.values(location ?? {})
      .map((value) => {
        if (typeof value === "string") return value.trim();
        if (typeof value === "number") return String(value);
        return "";
      })
      .filter(Boolean);

    if (values.length > 0) {
      return values.join(", ");
    }
  }

  return "Not provided";
}

function formatTimestamp(timestamp: string | null) {
  if (!timestamp) return "—";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  return date.toLocaleString();
}

export const dynamic = "force-dynamic";

export default async function ViewListingsPage({ searchParams }: { searchParams: { search?: string } }) {
  const supabase = await createClient();
  const reservedParams = await searchParams;
  const searchTerm = reservedParams.search ?? ''

  const query = supabase
    .from("listing")
    .select("*")
    .order("created_at", { ascending: false });


  let func;

  if (!searchTerm) {
    func = await query
  }
  else{
    func = await supabase.rpc('fuzzy_search_listings', { search: searchTerm });
  }

  const { data, error } = func;
  const listings  = (data ?? []) as Listing[];


  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-16 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Marketplace Listings
            </h1>
            <p className="text-sm text-muted-foreground">
              Browse every item currently available in CollegeCart.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground"
          >
            Back to home
          </Link>
        </header>
        <Search/>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Could not load listings. Please refresh the page or try again later.
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No listings yet. Once sellers post items they will appear here.
          </div>
        ) : (
          <ul className="grid gap-4">
            {listings.map((listing) => (
              <li
                key={listing.listing_id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/60 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-medium leading-tight">
                      {listing.title || "Untitled listing"}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Posted {formatTimestamp(listing.created_at)}
                    </p>
                  </div>
                  <div className="text-right text-lg font-semibold text-primary">
                    {formatPrice(listing.price_cents, listing.currency)}
                  </div>
                </div>

                {listing.description ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {listing.description}
                  </p>
                ) : null}

                <dl className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <dt className="font-medium text-foreground">Condition</dt>
                    <dd className="capitalize">
                      {listing.condition ?? "Not specified"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <dt className="font-medium text-foreground">Status</dt>
                    <dd className="capitalize">
                      {listing.status ?? "Not specified"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <dt className="font-medium text-foreground">Quantity</dt>
                    <dd>{listing.quantity ?? "—"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-start">
                    <dt className="font-medium text-foreground">Location</dt>
                    <dd>{formatLocation(listing.location)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
