'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Search } from 'lucide-react';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';

// Dummy data for the item
const dummyItem = {
  id: '1',
  title: 'Carnegie Mellon Scotty Tote Bag',
  price: 25.00,
  category: 'Accessories',
  brand: 'Carnegie Mellon University',
  condition: 'Like New',
  dateListed: '2024-01-15',
  description: 'Cream-colored canvas tote bag with red accents and embroidered Scotty dog design. Perfect for carrying books, groceries, or campus essentials. Includes branded drink containers. Great condition, barely used.',
  imageUrl: '/scotty-tote-dummy.jpg',
  isLiked: false,
};

export default function ItemPage() {
  const params = useParams();
  const itemId = params.item_id as string;
  const [isLiked, setIsLiked] = useState(dummyItem.isLiked);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

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
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={handleLike}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                  />
                </Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Item Image */}
          <div className="w-full">
            <Card className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                <Image
                  src={dummyItem.imageUrl}
                  alt={dummyItem.title}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </Card>
          </div>

          {/* Item Details */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-4xl font-bold mb-4">{dummyItem.title}</h1>
              <p className="text-3xl font-bold text-primary mb-6">
                ${dummyItem.price.toFixed(2)}
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
                  <Badge variant="secondary">{dummyItem.category}</Badge>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">
                    Brand
                  </span>
                  <span className="font-medium">{dummyItem.brand}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">
                    Condition
                  </span>
                  <span className="font-medium">{dummyItem.condition}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-muted-foreground font-medium">
                    Date Listed
                  </span>
                  <span className="font-medium">{dummyItem.dateListed}</span>
                </div>
                <div className="pt-2">
                  <span className="text-muted-foreground font-medium block mb-2">
                    Item Description
                  </span>
                  <p className="text-sm leading-relaxed">
                    {dummyItem.description}
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
    </div>
  );
}

