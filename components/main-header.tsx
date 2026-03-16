'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingCart, MessageCircle, Settings } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
      setAuthError('Please sign in to access your messages');
      return;
    }
    router.push('/chat');
  };

  const handleSignIn = async () => {
    try {
      await signInWithKeycloak({ callbackURL: window.location.href });
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
    <>
    <header className="bg-[#2f167a] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between py-3 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
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
              <button
                onClick={() => void handleSignIn()}
                className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer"
              >
                Sign In
              </button>
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

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-60' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col border-t border-white/20 px-4 py-2 gap-1">
          <button
            onClick={(e) => { handleChatClick(e); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <span className="relative">
              <MessageCircle className="h-5 w-5" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#2f167a]" />
              )}
            </span>
            Chat
          </button>
          <Link
            href="/cart"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            Liked
          </Link>
          {isSignedIn && (
            <Link
              href="/selling"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <Settings className="h-5 w-5" />
              Account Settings
            </Link>
          )}
        </nav>
      </div>
    </header>

    <div className="md:hidden bg-[#2f167a] px-4 pb-3">
      <SearchBar
        placeholder="Search CollegeCart"
        className="w-full"
        inputClassName="pl-10 h-10 rounded-full bg-white text-slate-900"
        iconClassName="h-5 w-5 opacity-80 text-slate-500"
      />
    </div>

    {/* Auth Error Popup */}
    {authError && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-sm bg-white rounded-2xl border-2 border-primary/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-primary/5 py-4 px-6 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Authentication Required</h3>
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setAuthError(null)}
                className="h-8 w-8 rounded-full text-slate-500"
              >
                <X className="h-4 w-4" />
              </Button>
          </div>
          <div className="p-6 text-center">
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
          </div>
        </div>
      </div>
    )}
    </>
  );
}
