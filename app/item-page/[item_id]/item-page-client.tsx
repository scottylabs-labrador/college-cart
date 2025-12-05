'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, ChevronLeft, ChevronRight, MessageCircle } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import SearchBar from '@/components/search-bar';
import ChatModal from '@/components/chat-modal';

type ListingData = {
  id: string;
  seller_id: string;
  title: string;
  price: number;
  priceFormatted: string;
  description: string;
  condition: string;
  quantity: number;
  dateListed: string;
  imageUrls: string[];
  category: string;
};

const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ""; 

const supabase = createClient(
  'https://dkmaapjiqiqyxbjyshky.supabase.co',
 key
)

export default function ItemPageClient({ listing }: { listing: ListingData }) {
  const [isLiked, setIsLiked] = useState(false);
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { userId, isSignedIn } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);   

  useEffect(() => {
    const fetchLike = async () => {
      const { data, error } = await supabase
        .from('favorite')
        .select('id')
        .eq('user_id', userId) 
        .eq('listing_id', listing.id)
        .order('created_at', { ascending: true });
      if (error) {
        console.error("Error fetching messages:", error);
      } else if (data) {
        const exists = (data?.length ?? 0) > 0;
        setIsLiked(exists);
      }
    };

    fetchLike();
  }, [])

  const handleLike = async(e: React.FormEvent)  => {
    e.preventDefault();
    if(!isSignedIn || !userId){
      alert("You must be logged in to like a listing!");
      return;
    }
    setIsLiked(!isLiked);

    const formData = new FormData();
    formData.append("listing_id", listing.id);
    formData.append("user_id", userId);

    try{
      const response = await fetch("/item-page/[item_id]/f_action", {
        method : "POST",
        body : formData
      });

      const result = await response.json();

      if (!response.ok) {
        // Show the actual error message from the server
        const errorMessage = result.error || "Failed to like listing. Please try again.";
        alert(`Error: ${errorMessage}`);
        console.error("Server error:", result);
        return;
      }

      if (result.success && result.favorite_id) {
          // Redirect to the item listing page
          console.log(result.favorite_id);
        } else {
          const errorMessage = result.error || "Liked but failed to get ID. Please try again.";
          alert(`Error: ${errorMessage}`);
          console.error("Unexpected response:", result);
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("Network error: Failed to connect to server. Please check your connection and try again.");
      }

  };

  const handleChat = async () => {
    if (!isSignedIn || !userId) {
      alert("You must be logged in to chat with the seller!");
      return;
    }

    if (userId === listing.seller_id) {
      alert("You cannot chat with yourself!");
      return;
    }

    // Create or get conversation
    try {
      const formData = new FormData();
      formData.append("listing_id", listing.id);
      formData.append("buyer_id", userId);
      formData.append("seller_id", listing.seller_id);

      const response = await fetch(`/item-page/${listing.id}/action`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success && result.conversation_id) {
        setConversationId(result.conversation_id.toString());
        setIsChatOpen(true);
      } else {
        alert(result.error || "Failed to start conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  const handleOffer = async(e: React.FormEvent)  => {
    e.preventDefault();
    if (!isSignedIn || !userId) {
    alert("You must be logged in to make an offer!");
    return;
  }
    if(!userId){
      alert("You must be logged into make an offer!")
      return;
    }

    const formData = new FormData();
    formData.append("listing_id", listing.id);
    formData.append("seller_id", listing.seller_id);
    formData.append("buyer_id", userId );
    
    try{
      const response = await fetch("/item-page/[item_id]/action", {
        method : "POST",
        body : formData
      });

      const result = await response.json();

      if (!response.ok) {
        // Show the actual error message from the server
        const errorMessage = result.error || "Failed to send offer. Please try again.";
        alert(`Error: ${errorMessage}`);
        console.error("Server error:", result);
        return;
      }

      if (result.success && result.conversation_id) {
          // Redirect to the item listing page
          router.push(`/chat/convo?chat=${result.conversation_id}`);
          console.log(result.conversation_id);
        } else {
          const errorMessage = result.error || "Offer made but failed to get ID. Please try again.";
          alert(`Error: ${errorMessage}`);
          console.error("Unexpected response:", result);
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("Network error: Failed to connect to server. Please check your connection and try again.");
      }
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) => 
      prev > 0 ? prev - 1 : listing.imageUrls.length - 1
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev < listing.imageUrls.length - 1 ? prev + 1 : 0
    );
  };

  const currentImage = listing.imageUrls[selectedImageIndex] || '/scotty-tote-dummy.jpg';

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-blue.png"
                alt="CollegeCart Logo"
                width={60}
                height={60}
                className="object-contain"
              />
              <span className="font-semibold text-lg">CollegeCart</span>
            </Link>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-4">
              <SearchBar
                placeholder="Search items..."
                className="w-full"
                inputClassName="pl-10"
                iconClassName="h-4 w-4 text-muted-foreground"
              />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                {/* <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={handleLike}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button> */}
                <Link href="/post-item">
                  <Button variant="outline" size="sm">
                    Sell
                  </Button>
                </Link>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Item Image */}
          <div className="w-full">
            <Card className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {listing.imageUrls.length > 0 ? (
                  <>
                    <img
                      src={currentImage}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    {listing.imageUrls.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                          onClick={handlePreviousImage}
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                          onClick={handleNextImage}
                        >
                          <ChevronRight className="w-6 h-6" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                          {listing.imageUrls.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedImageIndex(index)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                index === selectedImageIndex
                                  ? 'bg-white w-6'
                                  : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image available
                  </div>
                )}
              </div>
            </Card>
            {/* Thumbnail Gallery */}
            {listing.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {listing.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square relative rounded-lg overflow-hidden border-2 transition-all ${
                      index === selectedImageIndex
                        ? 'border-primary'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${listing.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item Details */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{listing.title}</h1>
              <p className="text-3xl font-bold text-primary mb-6">
                {listing.priceFormatted}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mb-6">
                <Button 
                  size="lg" 
                  className="flex-1 border-0 text-white"
                  style={{
                    background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #3d2599, #9d7ff0)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(to right, #4a2db8, #a78bfa)';
                  }}
                  onClick = {handleOffer}
                >
                  Make Offer
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={handleLike}
                >
                  <Heart
                    className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={handleChat}
                  title="Chat with seller"
                >
                  <MessageCircle className="w-6 h-6" />
                </Button>
              </div>
            </div>

            {/* Item Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">
                    Category
                  </span>
                  <Badge variant="secondary">{listing.category}</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">
                    Condition
                  </span>
                  <span className="font-medium">{listing.condition}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">
                    Quantity Available
                  </span>
                  <span className="font-medium">{listing.quantity}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">
                    Date Listed
                  </span>
                  <span className="font-medium">{listing.dateListed}</span>
                </div>
                <div className="pt-2">
                  <span className="text-muted-foreground font-medium block mb-2">
                    Item Description
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {listing.description || 'No description provided.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <SignedOut>
                <div className="p-8 text-center border border-dashed rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">
                    You need to sign in to comment on this item.
                  </p>
                  <div className="flex gap-3 justify-center mt-4">
                    <SignInButton mode="modal">
                      <Button variant="outline">Sign In</Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <Button 
                        className="border-0 text-white"
                        style={{
                          background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(to right, #3d2599, #9d7ff0)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(to right, #4a2db8, #a78bfa)';
                        }}
                      >
                        Sign Up
                      </Button>
                    </SignUpButton>
                  </div>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium">U</span>
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Write a comment..."
                        className="w-full"
                      />
                      <div className="flex justify-end mt-2">
                        <Button 
                          size="sm" 
                          className="border-0 text-white"
                          style={{
                            background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(to right, #3d2599, #9d7ff0)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(to right, #4a2db8, #a78bfa)';
                          }}
                        >
                          Post Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to comment!
                  </div>
                </div>
              </SignedIn>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        conversationId={conversationId}
        listingTitle={listing.title}
      />
    </div>
  );
}
