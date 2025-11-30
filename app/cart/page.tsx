'use client';

import React from "react";
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react'
import { useState } from 'react';
import FavoriteClient from "./favorite-client";

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

const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY || ""; 

const supabase = createClient(
  'https://dkmaapjiqiqyxbjyshky.supabase.co',
 key)

export default function CollegeCartHome() {
  const { userId, isSignedIn } = useAuth();
  const [selectListings, setSelectedListings] = useState<ListingDisplay[]>([]);

  useEffect(() => {
    if(!isSignedIn){
        alert("You must be signed in to access favorites!");
        return;
    }

    const fetchFavorites = async() => {
        const { data, error } = await supabase  
            .from("favorite")
            .select("*")
            .eq("user_id", userId)
        
        if (error) {
            console.error("Error fetching favorites:", error);
            return;
        } 

        const favIds = data?.map(fav => fav.listing_id) || [];

        const { data: listings, error: listingError } = await supabase
            .from('listing')
            .select('*')
            .in('listing_id', favIds)
            .order("created_at", { ascending: false });
        if (listingError){
            console.error("Error accessing favorites", listingError);
            return;
        }

        const listingsWithImages = await Promise.all(
        (listings || []).map(async (listing: Listing) => {
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

    setSelectedListings(listingsWithImages);
    };

    fetchFavorites();
    

 }, [])


  return <FavoriteClient listings={selectListings} />;
}
