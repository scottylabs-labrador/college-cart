import Link from "next/link";
import Image from "next/image";
import { isRemoteImageSrc } from "@/lib/storage-image";

export type ListingCardItem = {
  id: string;
  title: string;
  priceFormatted: string;
  imageUrl: string;
  href: string;
};

/** The grid every page uses to lay out listing cards. */
export const LISTING_GRID = "grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4";

/**
 * One listing in a grid: a square photo, a title of up to two lines and the
 * price. The title always reserves two lines so prices line up across a row.
 */
export function ListingCard({
  listing,
  sold = false,
  unoptimized,
  onClick,
}: {
  listing: ListingCardItem;
  /** Dims the photo and price and shows a "Sold" label. */
  sold?: boolean;
  /** Skips image optimisation. Defaults to true for remote and inline images. */
  unoptimized?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={listing.href}
      onClick={onClick}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
    >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f0ecfa]">
        <Image
          src={listing.imageUrl}
          alt={listing.title}
          fill
          unoptimized={unoptimized ?? (isRemoteImageSrc(listing.imageUrl) || listing.imageUrl.startsWith("data:"))}
          sizes="(max-width: 768px) 50vw, 25vw"
          className={`object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
            sold ? "opacity-60" : ""
          }`}
        />
        {sold && (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Sold
          </span>
        )}
      </div>
      <div className="pt-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-base leading-5 text-slate-900 group-hover:underline group-hover:underline-offset-2">
          {listing.title}
        </h3>
        <p className={`mt-1 text-lg font-semibold ${sold ? "text-slate-400" : "text-primary"}`}>
          {listing.priceFormatted}
        </p>
      </div>
    </Link>
  );
}
