'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MessageCircle, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'

import MainHeader from '@/components/main-header';

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
  const isOwner = Boolean(isSignedIn && userId && userId === listing.seller_id);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [uncollapseTrigger, setUncollapseTrigger] = useState(0);
  const [openConfirmationTrigger, setOpenConfirmationTrigger] = useState(0);   

  useEffect(() => {
    if (!userId || userId === listing.seller_id) {
      return;
    }

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
  }, [userId, listing.id, listing.seller_id])

  const handleLike = async(e: React.FormEvent)  => {
    e.preventDefault();
    if(!isSignedIn || !userId){
      alert("You must be logged in to like a listing!");
      return;
    }
    if (userId === listing.seller_id) {
      alert("You cannot like your own listing!");
      return;
    }

    const formData = new FormData();
    formData.append("listing_id", listing.id);
    formData.append("user_id", userId);

    try{
      const response = await fetch("/item-page/[item_id]/f_action", {
        method : "POST",
        body : formData
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Show the actual error message from the server
        const errorMessage = result.error || "Failed to like listing. Please try again.";
        alert(`Error: ${errorMessage}`);
        console.error("Server error:", result);
        return;
      }

      // Update the like state based on the server response
      setIsLiked(result.liked ?? !isLiked);
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: Failed to connect to server. Please check your connection and try again.");
      // Revert the optimistic update on error
      setIsLiked(!isLiked);
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

    // Reset confirmation trigger to prevent opening confirmation dialog when using chat button
    setOpenConfirmationTrigger(0);

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

    if (userId === listing.seller_id) {
      alert("You cannot make an offer on your own listing!");
      return;
    }

    const formData = new FormData();
    formData.append("listing_id", listing.id);
    formData.append("seller_id", listing.seller_id);
    formData.append("buyer_id", userId );
    
    try{
      const response = await fetch(`/item-page/${listing.id}/action`, {
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
          // Open the chat modal instead of redirecting
          setConversationId(result.conversation_id.toString());
          setIsChatOpen(true);
          setUncollapseTrigger(prev => prev + 1); // Increment to trigger uncollapse
          setOpenConfirmationTrigger(prev => prev + 1); // Increment to trigger confirmation dialog
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

  const handleDelete = async () => {
    if (!isSignedIn || !userId) {
      alert("You must be logged in to delete a listing!");
      return;
    }

    if (userId !== listing.seller_id) {
      alert("You can only delete your own listing!");
      return;
    }

    const confirmed = window.confirm("Delete this posting? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    const formData = new FormData();
    formData.append("listing_id", listing.id);
    formData.append("user_id", userId);

    try {
      const response = await fetch(`/item-page/${listing.id}/delete`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || "Failed to delete listing. Please try again.";
        alert(`Error: ${errorMessage}`);
        console.error("Server error:", result);
        return;
      }

      router.push("/selling");
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
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <MainHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
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
                {isOwner ? (
                  <Button 
                    size="lg" 
                    className="flex-1 border-0 text-white"
                    style={{
                      background: 'linear-gradient(to right, #fca5a5, #f87171)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #f87171, #ef4444)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #fca5a5, #f87171)';
                    }}
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete Listing
                  </Button>
                ) : (
                  <>
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
                      <ShoppingCart
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
                  </>
                )}
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
        {/* <div className="mt-12">
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
        </div> */}
      </main>

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        conversationId={conversationId}
        listingTitle={listing.title}
        uncollapseTrigger={uncollapseTrigger}
        openConfirmationTrigger={openConfirmationTrigger}
      />
    </div>
  );
}
