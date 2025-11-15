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
import { Search, Upload, X } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import RequireLogin from '@/components/require_login';

export default function PostItemPage() {
  const { isLoaded, userId } = useAuth();
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [condition, setCondition] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log({ category, brand, condition, title, description, imageFile });
    // You can add your API call here
  };

  if (!isLoaded || !userId) {
    return <RequireLogin />;
  }

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
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
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
                <Button variant="outline" size="sm">
                  Sell
                </Button>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo-blue.png"
              alt="CollegeCart Logo"
              width={40}
              height={40}
              className="object-contain rounded-full"
            />
          </Link>
          <h1 className="text-3xl font-bold">List an item</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image Upload Section */}
            <div className="w-full">
              <Card className="overflow-hidden">
                <CardContent className="p-8">
                  <div className="aspect-square bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors relative">
                    {imagePreview ? (
                      <>
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
                          aria-label="Remove image"
                        >
                          <X className="w-4 h-4 text-foreground" />
                        </button>
                      </>
                    ) : (
                      <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                        <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                        <span className="text-muted-foreground font-medium">
                          upload photo
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Product Info Section */}
            <div className="w-full">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-2xl font-semibold mb-6">Product Info</h2>

                  {/* Category Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="category"
                      className="text-sm font-medium text-foreground"
                    >
                      Category
                    </label>
                    <Input
                      id="category"
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Electronics, Clothing, Furniture"
                      className="w-full"
                    />
                  </div>

                  {/* Brand Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="brand"
                      className="text-sm font-medium text-foreground"
                    >
                      Brand
                    </label>
                    <Input
                      id="brand"
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="e.g., Apple, Nike, IKEA"
                      className="w-full"
                    />
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
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Like New">Like New</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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
                      className="w-full border-0 text-white"
                      style={{
                        background: 'linear-gradient(to right, #4a2db8, #a78bfa)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'linear-gradient(to right, #3d2599, #9d7ff0)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'linear-gradient(to right, #4a2db8, #a78bfa)';
                      }}
                    >
                      List Item
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

