'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
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
            setImagePreviews((prev) => [...prev, ...newImages]);
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
    
    // Frontend validation
    if (!title.trim()) {
      alert("Please enter a title for your item.");
      setIsSubmitting(false);
      return;
    }
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
    if (!userId) {
      alert("You must be logged in to post an item.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price_cents", Math.round(parseFloat(price) * 100).toString());
    formData.append("condition", condition);
    formData.append("quantity", Math.round(parseInt(quantity)).toString());
    formData.append("status", "active"); 
    formData.append("user_id", userId || "");
    formData.append("category", (category).toString());
    // Location is optional, so we don't need to send it if it's not in the form
    
    // Append all images from imagePreviews
    imagePreviews.forEach((image) => {
      formData.append("images", image.file);
    });

    try {
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
        return;
      }

      if (result.success && result.listing_id) {
        // Redirect to the item listing page
        router.push(`/item-page/${result.listing_id}`);
      } else {
        const errorMessage = result.error || "Listing added but failed to get item ID. Please try again.";
        alert(`Error: ${errorMessage}`);
        console.error("Unexpected response:", result);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Network error: Failed to connect to server. Please check your connection and try again.");
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

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
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
                      {isSubmitting ? 'Listing...' : 'List Item'}
                    </Button>
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
