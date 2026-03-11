'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, ShoppingCart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signInWithKeycloak, signOutFromAuth, useAuth, useUser } from '@/lib/auth-client';
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
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const checkUnread = useCallback(async () => {
    if (!isSignedIn || !userId) return;
    try {
      const res = await fetch('/chat/api/conversations');
      const data = await res.json();
      if (!data.success) return;
      const timestamps = getLastReadTimestamps();
      const unread = (data.conversations as Conversation[]).some((conv) => {
        if (!conv.last_message_sender || conv.last_message_sender === userId) return false;
        if (!conv.last_message_time) return false;
        const lastRead = timestamps[conv.conversation_id];
        return !lastRead || new Date(conv.last_message_time) > new Date(lastRead);
      });
      setHasUnread(unread);
    } catch { /* ignore */ }
  }, [isSignedIn, userId]);

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

  const handleSignIn = async (requestSignUp = false) => {
    try {
      await signInWithKeycloak({
        callbackURL: window.location.href,
        requestSignUp,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to sign in.');
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutFromAuth();
      router.push('/');
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const userLabel = user?.name || user?.email?.split('@')[0] || 'Account';

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
            {!isSignedIn && (
              <>
                <button
                  onClick={() => void handleSignIn(false)}
                  className="rounded-full border border-white/40 px-3 py-2 text-sm font-medium hover:bg-white/10"
                >
                  Sign In
                </button>
                <button
                  onClick={() => void handleSignIn(true)}
                  className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            )}
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
            {isSignedIn && (
              <>
              <Link href="/cart" className="hidden md:flex" title="Cart">
                <ShoppingCart className="h-6 w-6" />
              </Link>
                <Link href="/selling" className="hidden md:flex text-sm font-medium" title="Items for Sale">
                  {userLabel}
                </Link>
                <button
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                  className="rounded-full border border-white/40 px-3 py-2 text-sm font-medium disabled:opacity-60"
                >
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </>
            )}
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
