'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MessageCircle, ShoppingCart, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'

import MainHeader from '@/components/main-header';

import Image from 'next/image';
import ChatModal from '@/components/chat-modal';
import posthog from 'posthog-js';

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
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
  const [authError, setAuthError] = useState<string | null>(null);
  const hasTrackedView = useRef(false);

  // Track listing viewed event (top of conversion funnel)
  useEffect(() => {
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      posthog.capture('listing_viewed', {
        listing_id: listing.id,
        listing_title: listing.title,
        price: listing.price,
        category: listing.category,
        condition: listing.condition,
        is_owner: isOwner,
      });
    }
  }, [listing.id, listing.title, listing.price, listing.category, listing.condition, isOwner]);

  // Lightbox zoom state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const ZOOM_MIN = 1;
  const ZOOM_MAX = 4;
  const ZOOM_STEP = 0.5;

  const openLightbox = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const zoomIn = () => {
    setZoomLevel(prev => {
      const next = Math.min(prev + ZOOM_STEP, ZOOM_MAX);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const zoomOut = () => {
    setZoomLevel(prev => {
      const next = Math.max(prev - ZOOM_STEP, ZOOM_MIN);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleLightboxWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoomLevel(prev => {
        const next = Math.min(prev + ZOOM_STEP, ZOOM_MAX);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    } else {
      setZoomLevel(prev => {
        const next = Math.max(prev - ZOOM_STEP, ZOOM_MIN);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    }
  }, []);

  const handlePanStart = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning || zoomLevel <= 1) return;
    setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handlePreviousImage = useCallback(() => {
    setSelectedImageIndex((prev) => 
      prev > 0 ? prev - 1 : listing.imageUrls.length - 1
    );
  }, [listing.imageUrls.length]);

  const handleNextImage = useCallback(() => {
    setSelectedImageIndex((prev) => 
      prev < listing.imageUrls.length - 1 ? prev + 1 : 0
    );
  }, [listing.imageUrls.length]);

  // Close lightbox on Escape, navigate with arrow keys
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') handlePreviousImage();
      if (e.key === 'ArrowRight') handleNextImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, handlePreviousImage, handleNextImage]);

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
      setAuthError("You must be logged in to like a listing!");
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
      const newLikedState = result.liked ?? !isLiked;
      setIsLiked(newLikedState);

      // Track cart add/remove event
      if (newLikedState) {
        posthog.capture('item_added_to_cart', {
          listing_id: listing.id,
          listing_title: listing.title,
          price: listing.price,
          category: listing.category,
          condition: listing.condition,
        });
      } else {
        posthog.capture('item_removed_from_cart', {
          listing_id: listing.id,
          listing_title: listing.title,
          price: listing.price,
          category: listing.category,
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: Failed to connect to server. Please check your connection and try again.");
      // Revert the optimistic update on error
      setIsLiked(!isLiked);
      posthog.captureException(error);
    }

  };

  const handleChat = async () => {
    if (!isSignedIn || !userId) {
      setAuthError("You must be logged in to chat with the seller!");
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

        // Track chat started event
        posthog.capture('chat_started', {
          listing_id: listing.id,
          listing_title: listing.title,
          price: listing.price,
          category: listing.category,
          conversation_id: result.conversation_id,
        });
      } else {
        alert(result.error || "Failed to start conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to start conversation. Please try again.");
      posthog.captureException(error);
    }
  };

  const handleOffer = async(e: React.FormEvent)  => {
    e.preventDefault();
    if (!isSignedIn || !userId) {
      setAuthError("You must be logged in to make an offer!");
      return;
    }
    if(!userId){
      setAuthError("You must be logged in to make an offer!");
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

          // Track offer initiated event
          posthog.capture('offer_initiated', {
            listing_id: listing.id,
            listing_title: listing.title,
            price: listing.price,
            category: listing.category,
            condition: listing.condition,
            conversation_id: result.conversation_id,
          });
        } else {
          const errorMessage = result.error || "Offer made but failed to get ID. Please try again.";
          alert(`Error: ${errorMessage}`);
          console.error("Unexpected response:", result);
        }
      } catch (error) {
        console.error("Network error:", error);
        alert("Network error: Failed to connect to server. Please check your connection and try again.");
        posthog.captureException(error);
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

      // Track listing deleted event
      posthog.capture('listing_deleted', {
        listing_id: listing.id,
        listing_title: listing.title,
        price: listing.price,
        category: listing.category,
        condition: listing.condition,
      });

      router.push("/selling");
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: Failed to connect to server. Please check your connection and try again.");
      posthog.captureException(error);
    }
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
                    <Image
                      src={currentImage}
                      alt={listing.title}
                      fill
                      unoptimized
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover cursor-zoom-in"
                      onClick={openLightbox}
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
                    <Image
                      src={url}
                      alt={`${listing.title} ${index + 1}`}
                      fill
                      unoptimized
                      sizes="12.5vw"
                      className="object-cover"
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
      </main>

      {/* Image Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
          onWheel={handleLightboxWheel}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={(e) => { e.stopPropagation(); zoomOut(); }}
              disabled={zoomLevel <= ZOOM_MIN}
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <span className="text-white text-sm font-medium min-w-[3rem] text-center select-none">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
              onClick={(e) => { e.stopPropagation(); zoomIn(); }}
              disabled={zoomLevel >= ZOOM_MAX}
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 bg-black/50 hover:bg-black/70 text-white rounded-full ml-2"
              onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation arrows */}
          {listing.imageUrls.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviousImage();
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Zoomed image */}
          <div
            className="max-w-[90vw] max-h-[85vh] overflow-hidden"
            style={{
              cursor: zoomLevel < ZOOM_MAX
                ? (zoomLevel > 1 ? 'grab' : 'zoom-in')
                : (zoomLevel > 1 ? 'grab' : 'default'),
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (zoomLevel < ZOOM_MAX) zoomIn();
            }}
            onMouseDown={(e) => { e.stopPropagation(); handlePanStart(e); }}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
          >
            <img
              src={currentImage}
              alt={listing.title}
              className="max-w-[90vw] max-h-[85vh] object-contain select-none transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                cursor: isPanning ? 'grabbing' : undefined,
              }}
              draggable={false}
            />
          </div>

          {/* Image counter */}
          {listing.imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
              {selectedImageIndex + 1} / {listing.imageUrls.length}
            </div>
          )}
        </div>
      )}

      {/* Chat Modal */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        conversationId={conversationId}
        listingTitle={listing.title}
        uncollapseTrigger={uncollapseTrigger}
        openConfirmationTrigger={openConfirmationTrigger}
      />

      {/* Auth Error Popup */}
      {authError && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-sm border-2 border-primary/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <CardHeader className="bg-primary/5 py-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Authentication Required</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setAuthError(null)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-6">
                {authError}
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  className="w-full bg-[#4a2db8] hover:bg-[#3d2599] text-white rounded-xl h-11"
                  onClick={async () => {
                    setAuthError(null);
                    try {
                      const { signInWithKeycloak } = await import('@/lib/auth-client');
                      await signInWithKeycloak({ callbackURL: window.location.href });
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >
                  Sign In to Continue
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-sm text-slate-500 hover:text-slate-800"
                  onClick={() => setAuthError(null)}
                >
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
