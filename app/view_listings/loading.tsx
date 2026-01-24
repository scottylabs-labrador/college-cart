"use client";

import MainHeader from "@/components/main-header";

export default function LoadingViewListings() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MainHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="flex items-center gap-3 text-slate-700">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f167a]" />
          <p className="text-sm">Loading items...</p>
        </div>
      </main>
    </div>
  );
}
