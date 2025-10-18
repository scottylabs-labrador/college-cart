'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'

export default function Search() {
  const [search, setSearch] = useState('');
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/view_listings?search=${encodeURIComponent(search)}`)
  }
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search listings..."
          className="border p-2 rounded-md"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Search
        </button>
      </form>
    </div>
  );
}
