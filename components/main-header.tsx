'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  X,
  ShoppingCart,
  MessageCircle,
  ChevronDown,
  Package,
  UserRound,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signInWithKeycloak, signOutFromAuth, useAuth, useUser } from '@/lib/auth-client';
import SearchBar from '@/components/search-bar';
import { useRouter } from 'next/navigation';
import { Conversation } from '@/types/chat';
import { CHAT_READ_EVENT, countUnreadConversations } from '@/lib/chat-read-state';

export default function MainHeader() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const checkUnread = useCallback(async () => {
    if (!isSignedIn || !userId) {
      setUnreadChatsCount(0);
      return;
    }
    try {
      const res = await fetch('/chat/api/conversations');
      const data = await res.json();
      if (!data.success) return;
      setUnreadChatsCount(
        countUnreadConversations(data.conversations as Conversation[], userId),
      );
    } catch { /* ignore */ }
  }, [isSignedIn, userId]);

  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, 30_000);
    const onRead = () => {
      void checkUnread();
    };
    window.addEventListener(CHAT_READ_EVENT, onRead);
    window.addEventListener('focus', onRead);
    return () => {
      clearInterval(interval);
      window.removeEventListener(CHAT_READ_EVENT, onRead);
      window.removeEventListener('focus', onRead);
    };
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
              className="hidden md:inline-flex relative"
              title="Messages"
              aria-label={
                unreadChatsCount > 0
                  ? `Messages, ${unreadChatsCount > 9 ? 'more than 9' : unreadChatsCount} unread chats`
                  : 'Messages'
              }
            >
              <MessageCircle className="h-6 w-6" />
              {unreadChatsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#2f167a]">
                  {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                </span>
              )}
            </button>
            {isSignedIn && (
              <>
                <Link href="/cart" className="hidden md:flex" title="Cart">
                  <ShoppingCart className="h-6 w-6" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="hidden md:inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-white hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                    aria-label="Account menu"
                  >
                    <span className="inline-flex items-center gap-1">
                      {userLabel}
                      <ChevronDown className="h-4 w-4 opacity-90" />
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={8} className="min-w-[14rem]">
                    <div className="px-2 py-2 border-b border-border">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {user?.name || userLabel}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5 max-w-[240px]">
                          {user.email}
                        </p>
                      )}
                    </div>
                    <DropdownMenuItem
                      disabled={isSigningOut}
                      className="cursor-pointer"
                      onSelect={() => {
                        void handleSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      {isSigningOut ? 'Signing out…' : 'Sign out'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/selling" className="cursor-pointer">
                        <Package className="h-4 w-4" />
                        On Sale
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="cursor-pointer">
                        <UserRound className="h-4 w-4" />
                        Manage account
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
          mobileMenuOpen ? 'max-h-[28rem]' : 'max-h-0'
        }`}
      >
        <nav className="flex flex-col border-t border-white/20 px-4 py-2 gap-1">
          {isSignedIn && (
            <div className="px-3 py-2 mb-1 border-b border-white/15">
              <p className="text-sm font-semibold truncate">{user?.name || userLabel}</p>
              {user?.email && (
                <p className="text-xs text-white/70 truncate mt-0.5">{user.email}</p>
              )}
            </div>
          )}
          <button
            onClick={(e) => { handleChatClick(e); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
            aria-label={
              unreadChatsCount > 0
                ? `Chat, ${unreadChatsCount > 9 ? 'more than 9' : unreadChatsCount} unread chats`
                : undefined
            }
          >
            <span className="relative inline-flex">
              <MessageCircle className="h-5 w-5" />
              {unreadChatsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-[#2f167a]">
                  {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                </span>
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
            <>
              <Link
                href="/selling"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <Package className="h-5 w-5" />
                On Sale
              </Link>
              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <UserRound className="h-5 w-5" />
                Manage account
              </Link>
              <button
                type="button"
                disabled={isSigningOut}
                onClick={() => {
                  void handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors text-left disabled:opacity-60"
              >
                <LogOut className="h-5 w-5" />
                {isSigningOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
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
