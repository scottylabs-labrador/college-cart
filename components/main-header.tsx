'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, ShoppingCart, Store, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from '@clerk/nextjs';
import SearchBar from '@/components/search-bar';
import { useRouter } from 'next/navigation';
import { Conversation } from '@/types/chat';

const LAST_READ_KEY = 'chat_last_read';

function getLastReadTimestamps(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LAST_READ_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function MainHeader() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);

  const checkUnread = useCallback(async () => {
    if (!isSignedIn || !user) return;
    try {
      const res = await fetch('/chat/api/conversations');
      const data = await res.json();
      if (!data.success) return;
      const timestamps = getLastReadTimestamps();
      const unread = (data.conversations as Conversation[]).some((conv) => {
        if (!conv.last_message_sender || conv.last_message_sender === user.id) return false;
        if (!conv.last_message_time) return false;
        const lastRead = timestamps[conv.conversation_id];
        return !lastRead || new Date(conv.last_message_time) > new Date(lastRead);
      });
      setHasUnread(unread);
    } catch { /* ignore */ }
  }, [isSignedIn, user]);

  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, 30_000);
    return () => clearInterval(interval);
  }, [checkUnread]);

  const handleChatClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      alert('Please sign in to access your messages');
      return;
    }
    router.push('/chat');
  };

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
            <button
              onClick={handleChatClick}
              className="hidden md:flex relative"
              title="Messages"
            >
              <MessageCircle className="h-6 w-6" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#2f167a]" />
              )}
            </button>
            <SignedIn>
              <Link href="/cart" className="hidden md:flex" title="Cart">
                <ShoppingCart className="h-6 w-6" />
              </Link>
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
