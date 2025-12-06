"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  placeholder?: string;
  /**
   * Optional starting value so the input reflects the current query.
   */
  initialQuery?: string;
  /**
   * Destination path for search results (defaults to the listings search page).
   */
  searchPath?: string;
  className?: string;
  inputClassName?: string;
  iconClassName?: string;
};

export function SearchBar({
  placeholder = "Search listings...",
  initialQuery = "",
  searchPath = "/view_listings",
  className = "",
  inputClassName = "",
  iconClassName = "",
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  // Keep the field in sync when the server sends a new initial query
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const goToSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();

    if (trimmed.length > 0) {
      params.set("search", trimmed);
    }

    const href =
      params.size > 0 ? `${searchPath}?${params.toString()}` : searchPath;
    router.push(href);
  };

  const iconClasses = useMemo(
    () =>
      [
        "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground",
        iconClassName,
      ]
        .filter(Boolean)
        .join(" "),
    [iconClassName]
  );

  return (
    <form
      onSubmit={goToSearch}
      className={["relative w-full", className].filter(Boolean).join(" ")}
    >
      <SearchIcon className={iconClasses} />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={["pl-10", inputClassName].filter(Boolean).join(" ")}
      />
      <button type="submit" className="sr-only">
        Search
      </button>
    </form>
  );
}

export default SearchBar;
