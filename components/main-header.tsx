'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Menu,
  X,
  CircleHelp,
  ShoppingCart,
  MessageCircle,
  ChevronDown,
  Package,
  ParkingSquare,
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


/** What the "How it works" menu explains, for buyers and for sellers. */
const HOW_IT_WORKS = [
  {
    title: "Buying",
    steps: [
      "Browse the categories or search for what you need.",
      "Message the seller in chat to agree on a price and a time.",
      "Meet on campus and pay the seller directly with Zelle, Venmo or cash.",
    ],
  },
  {
    title: "Selling",
    steps: [
      "Tap Sell, add photos and set your price.",
      "Reply to interested buyers in chat.",
      "Hand the item over on campus. There are no listing or service fees.",
    ],
  },
];

function HowItWorksSteps({ onDark = false }: { onDark?: boolean }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {HOW_IT_WORKS.map((group) => (
        <div key={group.title}>
          <p className={`text-base font-semibold ${onDark ? "text-white" : "text-slate-900"}`}>{group.title}</p>
          <ol className="mt-3 space-y-3">
            {group.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm leading-5">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    onDark ? "bg-white text-primary" : "bg-primary text-white"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={onDark ? "text-white/90" : "text-slate-700"}>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

/** Shared look of the controls that sit on the purple header bar. */
const HEADER_ICON_BUTTON =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80";
const HEADER_TEXT_BUTTON =
  "inline-flex h-10 items-center gap-2 rounded-lg px-3 text-base font-medium text-white transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80";
const MOBILE_MENU_ITEM =
  "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium text-left transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80";
const UNREAD_BADGE =
  "absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-primary";

export default function MainHeader() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mobileHowOpen, setMobileHowOpen] = useState(false);

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
    <header className="bg-primary bg-[radial-gradient(40%_500%_at_46%_50%,#6940c9_40%,#4b2d8f_98%)] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`${HEADER_ICON_BUTTON} -ml-2 md:hidden`}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <Image
                src="/logo-white-cropped.png"
                alt=""
                width={44}
                height={32}
                className="h-8 w-auto translate-y-px"
              />
              <span className="pt-1 text-2xl font-bold leading-none tracking-[0.01em]">CollegeCart</span>
            </Link>
          </div>

          <div className="hidden max-w-xl flex-1 items-center md:flex">
            <SearchBar
              placeholder="Search CollegeCart"
              className="w-full"
              inputClassName="pl-10 pt-1.5 h-10 rounded-full border-transparent bg-white text-base md:text-base text-slate-900 shadow-none focus-visible:border-white focus-visible:ring-white/60"
              iconClassName="h-5 w-5 text-slate-500"
            />
          </div>

          <div className="flex items-center gap-1 lg:gap-2">
            {!isSignedIn && (
            <DropdownMenu>
              <DropdownMenuTrigger className={`${HEADER_TEXT_BUTTON} hidden md:inline-flex`} aria-label="How it works">
                <CircleHelp className="h-5 w-5" />
                <span className="hidden pt-0.5 lg:inline">How it works</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-[30rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl p-0">
                <div className="p-5">
                  <HowItWorksSteps />
                </div>
                <div className="flex items-center justify-between gap-4 border-t bg-[#f0ecfa] px-5 py-3">
                  <p className="text-sm text-slate-700">Ready to list something?</p>
                  <DropdownMenuItem asChild className="cursor-pointer px-0 py-0 focus:bg-transparent">
                    <Link href="/post-item" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                      Start selling
                    </Link>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
            <button
              onClick={handleChatClick}
              className={`${HEADER_ICON_BUTTON} hidden md:inline-flex`}
              title="Messages"
              aria-label={
                unreadChatsCount > 0
                  ? `Messages, ${unreadChatsCount > 9 ? 'more than 9' : unreadChatsCount} unread chats`
                  : 'Messages'
              }
            >
              <MessageCircle className="h-6 w-6" />
              {unreadChatsCount > 0 && (
                <span className={UNREAD_BADGE}>
                  {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                </span>
              )}
            </button>
            {isSignedIn && (
              <>
                <Link
                  href="/cart"
                  className={`${HEADER_ICON_BUTTON} hidden md:inline-flex`}
                  title="Liked items"
                  aria-label="Liked items"
                >
                  <ShoppingCart className="h-6 w-6" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={`${HEADER_TEXT_BUTTON} hidden md:inline-flex`}
                    aria-label="Account menu"
                  >
                    <span className="max-w-[10rem] truncate pt-0.5">{userLabel}</span>
                    <ChevronDown className="h-4 w-4 opacity-90" />
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
                      <Link href="/parking-lot" className="cursor-pointer">
                        <ParkingSquare className="h-4 w-4" />
                        Parking Lot
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
            {!isSignedIn && (
              <button onClick={() => void handleSignIn()} className={HEADER_TEXT_BUTTON}>
                <span className="pt-0.5">Sign in</span>
              </button>
            )}
            <Link
              href="/post-item"
              className="ml-1 inline-flex h-10 items-center rounded-lg bg-white px-6 text-base font-medium text-primary transition-colors hover:bg-[#f0ecfa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              <span className="pt-0.5">Sell</span>
            </Link>
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <SearchBar
            placeholder="Search CollegeCart"
            className="w-full"
            inputClassName="pl-10 pt-1.5 h-10 rounded-full border-transparent bg-white text-base text-slate-900 shadow-none focus-visible:border-white focus-visible:ring-white/60"
            iconClassName="h-5 w-5 text-slate-500"
          />
        </div>
      </div>

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-[60rem]' : 'max-h-0'
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
            className={MOBILE_MENU_ITEM}
            aria-label={
              unreadChatsCount > 0
                ? `Messages, ${unreadChatsCount > 9 ? 'more than 9' : unreadChatsCount} unread chats`
                : undefined
            }
          >
            <span className="relative inline-flex">
              <MessageCircle className="h-5 w-5" />
              {unreadChatsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-primary">
                  {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                </span>
              )}
            </span>
            Messages
          </button>
          <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className={MOBILE_MENU_ITEM}>
            <ShoppingCart className="h-5 w-5" />
            Liked items
          </Link>
          {isSignedIn && (
            <>
              <Link href="/selling" onClick={() => setMobileMenuOpen(false)} className={MOBILE_MENU_ITEM}>
                <Package className="h-5 w-5" />
                On Sale
              </Link>
              <Link href="/parking-lot" onClick={() => setMobileMenuOpen(false)} className={MOBILE_MENU_ITEM}>
                <ParkingSquare className="h-5 w-5" />
                Parking Lot
              </Link>
              <Link href="/account" onClick={() => setMobileMenuOpen(false)} className={MOBILE_MENU_ITEM}>
                <UserRound className="h-5 w-5" />
                Manage account
              </Link>
            </>
          )}
          {!isSignedIn && (
            <>
            <button
              type="button"
              onClick={() => setMobileHowOpen((prev) => !prev)}
              className={MOBILE_MENU_ITEM}
              aria-expanded={mobileHowOpen}
            >
              <CircleHelp className="h-5 w-5" />
              <span className="flex-1">How it works</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileHowOpen ? 'rotate-180' : ''}`} />
            </button>
            {mobileHowOpen && (
              <div className="px-3 pb-3 pt-1">
                <HowItWorksSteps onDark />
              </div>
            )}
            </>
          )}
          {isSignedIn && (
            <button
              type="button"
              disabled={isSigningOut}
              onClick={() => {
                void handleSignOut();
                setMobileMenuOpen(false);
              }}
              className={`${MOBILE_MENU_ITEM} disabled:opacity-60`}
            >
              <LogOut className="h-5 w-5" />
              {isSigningOut ? 'Signing out…' : 'Sign out'}
            </button>
          )}
        </nav>
      </div>
    </header>

    {/* Auth Error Popup */}
    {authError && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-sm bg-white rounded-xl border border-primary/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-primary/5 py-4 px-6 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Sign in required</h3>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setAuthError(null)}
                className="h-8 w-8 rounded-full text-slate-500"
                aria-label="Close"
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
                className="w-full h-11"
                onClick={async () => {
                  setAuthError(null);
                  try {
                    await signInWithKeycloak({ callbackURL: window.location.href });
                  } catch (err) {
                    console.error(err);
                  }
                }}
              >
                Sign in to continue
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm text-slate-500 hover:text-slate-800"
                onClick={() => setAuthError(null)}
              >
                Maybe later
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
