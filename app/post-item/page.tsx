'use client';


import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import RequireLogin from '@/components/require_login';
import { useRouter } from 'next/navigation';
import MainHeader from '@/components/main-header';
import Image from 'next/image';
import posthog from 'posthog-js';

const MAX_IMAGES = 10;

export default function PostItemPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState(0);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [condition, setCondition] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreviews, setImagePreviews] = useState<Array<{ url: string; file: File }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMode, setSubmitMode] = useState<'active' | 'draft'>('active');
  const hasTrackedStart = useRef(false);

  // Track post item started event (signals intent to sell - top of seller funnel)
  useEffect(() => {
    if (isLoaded && userId && !hasTrackedStart.current) {
      hasTrackedStart.current = true;
      posthog.capture('post_item_started', {
        user_id: userId,
      });
    }
  }, [isLoaded, userId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const remainingSlots = MAX_IMAGES - imagePreviews.length;
      
      if (remainingSlots <= 0) {
        e.target.value = '';
        return;
      }
      
      // Only process files up to the remaining slots
      const filesToProcess = fileArray.slice(0, remainingSlots);
      const newImages: Array<{ url: string; file: File }> = [];
      let loadedCount = 0;
      
      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          newImages.push({ url: reader.result as string, file });
          loadedCount++;
          if (loadedCount === filesToProcess.length) {
            setImagePreviews((prev) => {
              const newTotal = prev.length + newImages.length;
              // Track image upload event
              posthog.capture('image_uploaded', {
                images_added: newImages.length,
                total_images: newTotal,
              });
              return [...prev, ...newImages];
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async(e: React.FormEvent) =>{
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const isDraft = submitMode === 'draft';

    // Title is required for every submission so the user can find the
    // item again in their Parking Lot.
    if (!title.trim()) {
      alert("Please enter a title for your item.");
      setIsSubmitting(false);
      return;
    }

    // All other fields are only required when actually publishing.
    if (!isDraft) {
      if (!description.trim()) {
        alert("Please enter a description for your item.");
        setIsSubmitting(false);
        return;
      }
      if (!price || parseFloat(price) <= 0) {
        alert("Please enter a valid price greater than 0.");
        setIsSubmitting(false);
        return;
      }
      if (!quantity || parseInt(quantity) <= 0) {
        alert("Please enter a valid quantity greater than 0.");
        setIsSubmitting(false);
        return;
      }
      if (!condition) {
        alert("Please select a condition for your item.");
        setIsSubmitting(false);
        return;
      }
      if (imagePreviews.length <= 1) {
        alert("Please upload at least two images for your item.");
        setIsSubmitting(false);
        return;
      }
    }
    if (!userId) {
      alert("You must be logged in to post an item.");
      setIsSubmitting(false);
      return;
    }

    const priceCentsValue = price && parseFloat(price) > 0
      ? Math.round(parseFloat(price) * 100).toString()
      : '0';
    const quantityValue = quantity && parseInt(quantity) > 0
      ? Math.round(parseInt(quantity)).toString()
      : '1';

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price_cents", priceCentsValue);
    formData.append("condition", condition);
    formData.append("quantity", quantityValue);
    formData.append("status", isDraft ? "draft" : "active");
    formData.append("user_id", userId || "");
    formData.append("category", (category).toString());
    
    try {
      // 1. Upload images to S3 using presigned URLs
      const imageMetadata = await Promise.all(
        imagePreviews.map(async (image) => {
          const file = image.file;
          
          // Get presigned upload URL
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: file.name, contentType: file.type }),
          });
          
          if (!res.ok) throw new Error("Failed to get upload URL");
          
          const { url, key } = await res.json();

          // Upload directly to S3/Tigris
          const uploadRes = await fetch(url, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!uploadRes.ok) throw new Error("Failed to upload image to storage");

          return {
            name: file.name,
            type: file.type,
            size: file.size,
            key: key,
          };
        })
      );

      // 2. Append the image metadata (keys) to the form data
      formData.append("image_keys", JSON.stringify(imageMetadata));

      const response = await fetch("/post-item/action", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        // Show the actual error message from the server
        const errorMessage = result.error || "Failed to add listing. Please try again.";
        alert(`Error: ${errorMessage}`);
        console.error("Server error:", result);

        // Track listing creation failure
        posthog.capture('listing_creation_failed', {
          error_message: errorMessage,
          category: category,
          condition: condition,
          price_cents: Math.round(parseFloat(price) * 100),
          quantity: parseInt(quantity),
          image_count: imagePreviews.length,
        });
        return;
      }

      if (result.success && result.listing_id) {
        // Track successful listing creation
        posthog.capture(isDraft ? 'listing_drafted' : 'listing_created', {
          listing_id: result.listing_id,
          category: category,
          condition: condition,
          price_cents: Math.round(parseFloat(price || '0') * 100),
          quantity: parseInt(quantity || '0'),
          image_count: imagePreviews.length,
          title_length: title.length,
          description_length: description.length,
        });

        // Drafts land in the Parking Lot; published listings go live.
        if (isDraft) {
          router.push(`/parking-lot`);
        } else {
          router.push(`/item-page/${result.listing_id}`);
        }
      } else {
        const errorMessage = result.error || "Listing added but failed to get item ID. Please try again.";
        alert(`Error: ${errorMessage}`);
        console.error("Unexpected response:", result);

        // Track listing creation failure
        posthog.capture('listing_creation_failed', {
          error_message: errorMessage,
          category: category,
          condition: condition,
        });
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: Failed to connect to server. Please check your connection and try again.");

      // Track network error with exception capture
      posthog.captureException(error);
      posthog.capture('listing_creation_failed', {
        error_message: (error as Error).message || 'Network error',
        category: category,
        condition: condition,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded || !userId) {
    return <RequireLogin />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <MainHeader />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image Upload Section */}
            <div className="w-full">
              <Card className="overflow-hidden">
                <CardContent className="p-8 relative">
                  {imagePreviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {imagePreviews.map((image, index) => (
                          <div
                            key={index}
                            className="aspect-square bg-muted rounded-lg relative overflow-hidden border border-muted-foreground/25"
                          >
                            <Image
                              src={image.url}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                              aria-label="Remove image"
                            >
                              <X className="w-4 h-4 text-foreground" />
                            </button>
                          </div>
                        ))}
                        {imagePreviews.length < MAX_IMAGES && (
                          <label className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer">
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-muted-foreground font-medium text-sm">
                              Add more
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors relative">
                      <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                        <span className="text-muted-foreground font-medium">
                          upload photos
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground absolute bottom-10 left-4">
                    ( {MAX_IMAGES - imagePreviews.length}/{MAX_IMAGES} pictures remaining )
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Product Info Section */}
            <div className="w-full">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-2xl font-semibold mb-6">Product Info</h2>

                  {/* Title Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="title"
                      className="text-sm font-medium text-foreground"
                    >
                      Title
                    </label>
                    <Input
                      id="title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter item title"
                      className="w-full"
                    />
                  </div>

                  {/* Category Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="category"
                      className="text-sm font-medium text-foreground"
                    >
                      Category
                    </label>
                    <Select value={category.toString()} onValueChange={(value) => setCategory(Number(value))}>
                      <SelectTrigger id="category" className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Furniture</SelectItem>
                        <SelectItem value="2">Appliances</SelectItem>
                        <SelectItem value="3">Textbooks & Study Supplies</SelectItem>
                        <SelectItem value="4">Electronics</SelectItem>
                        <SelectItem value="5">Clothing</SelectItem>
                        <SelectItem value="6">Commute</SelectItem>
                        <SelectItem value="7">Free & Fun</SelectItem>
                        <SelectItem value="8">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="quantity"
                      className="text-sm font-medium text-foreground"
                    >
                      Quantity
                    </label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g., 1, 2, 3"
                      min="1"
                      className="w-full"
                    />
                  </div>

                  {/* Price Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="price"
                      className="text-sm font-medium text-foreground"
                    >
                      Price
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g., 19.99"
                        min="0.01"
                        className="w-full pl-7"
                      />
                    </div>
                  </div>

                  {/* Condition Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="condition"
                      className="text-sm font-medium text-foreground"
                    >
                      Condition
                    </label>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger id="condition" className="w-full">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like_new">Like New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="lightly_used">Lightly Used</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="description"
                      className="text-sm font-medium text-foreground"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your item..."
                      rows={6}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="pt-4 space-y-2">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      onClick={() => setSubmitMode('active')}
                      className="w-full border-0 text-white"
                      style={{
                        background: isSubmitting
                          ? '#8b7bc8'
                          : 'linear-gradient(to right, #4a2db8, #a78bfa)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.background =
                            'linear-gradient(to right, #3d2599, #9d7ff0)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.background =
                            'linear-gradient(to right, #4a2db8, #a78bfa)';
                        }
                      }}
                    >
                      {isSubmitting && submitMode === 'active' ? 'Listing...' : 'List Item'}
                    </Button>
                    <Button
                      type="submit"
                      size="lg"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => setSubmitMode('draft')}
                      className="w-full border-[#4a2db8] text-[#4a2db8] hover:bg-[#4a2db8]/5"
                    >
                      {isSubmitting && submitMode === 'draft'
                        ? 'Saving...'
                        : 'Save to Parking Lot'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Drafts stay private in your Parking Lot until you publish them.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
