'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, ShoppingCart, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/nextjs';
import SearchBar from '@/components/search-bar';

export default function MainHeader() {
  return (
    <header className="bg-[#2f167a] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3">
            <Menu className="h-6 w-6 md:hidden" />
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-white.png"
                alt="CollegeCart Logo"
                width={50}
                height={50}
                className="object-contain -mt-2"
              />
              <span className="font-semibold text-lg leading-none flex items-center">CollegeCart</span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 max-w-xl items-center gap-2">
            <SearchBar
              placeholder="Search CollegeCart"
              className="w-full"
              inputClassName="pl-10 h-11 rounded-full bg-white text-slate-900"
              iconClassName="h-5 w-5 opacity-80 text-slate-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton />
              <SignUpButton>
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton>
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Items for Sale"
                    labelIcon={<Store />}
                    href="/selling"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
            <Link href="/cart" className="hidden md:flex">
              <ShoppingCart className="h-6 w-6" />
            </Link>
            <Link href="/post-item">
              <Button className="bg-white text-[#2f167a] rounded-xl px-6">
                Sell
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
