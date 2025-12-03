'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import CategoryClient from './category-client';


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
  href: string;
};

function formatPrice(priceCents: number | null, currency: string | null) {
  if (priceCents === null) return "$0.00";
  const defaultCurrency = "USD";
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


const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""; 

const supabase = createClient(
  'https://dkmaapjiqiqyxbjyshky.supabase.co',
 key
)
export const dynamic = 'force-dynamic';

export default function CategoryPage(){
  const searchParams = useSearchParams();
  const category_id = parseInt(searchParams.get('c') ?? "", 10);
  const category_name = searchParams.get('n');
  const [categories, setCategory] = useState<ListingDisplay[]>([]);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
        const fetchCategory = async() => {
            setCategoryName(category_name || "")
            const { data: categoryData, error: categoryError } = await supabase
                .from('listing')
                .select('*')
                .eq('category_id', category_id)
                .order("created_at", { ascending: false });
            if (categoryError){
                console.error("Error accessing category", categoryError);
                return;
            }

          const listingsWithImages = await Promise.all(
          (categoryData || []).map(async (listing: Listing) => {
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
              imageUrl = `data:${img.storage.type || "image/jpeg"};base64,${img.storage.base64}`;
              }
          }
  
          return {
              id: listing.listing_id.toString(),
              title: listing.title || "Untitled Listing",
              price: listing.price_cents ? listing.price_cents / 100 : 0,
              priceFormatted: formatPrice(listing.price_cents, listing.currency),
              imageUrl: imageUrl || "/scotty-tote-dummy.jpg",
              href: `/item-page/${listing.listing_id}`,
          };
          })
  
      );
  
      setCategory(listingsWithImages);
      
      };

      
      fetchCategory();    
  
   }, [])

   return <CategoryClient listings={categories} name={categoryName} />;

}


