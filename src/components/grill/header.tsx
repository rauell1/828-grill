'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, Flame } from 'lucide-react';
import { useCart } from '@/store/cart';
import { useUI, View } from '@/store/ui';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

const NAV: { label: string; view: View }[] = [
  { label: 'Home', view: 'home' },
  { label: 'Menu', view: 'menu' },
];

export function Header() {
  const cartCount = useCart((s) => s.count());
  const { view, setView, setCartOpen } = useUI();
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNav = (v: View) => {
    setView(v);
    setMobileOpen(false);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/10 bg-[#0d0d0d]/90 backdrop-blur-xl'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => handleNav('home')}
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="828 Grill home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8531a] text-[#0d0d0d]">
            <Flame className="h-5 w-5" />
          </span>
          <span className="font-display text-2xl leading-none tracking-wider text-[#f5f0e8]">
            828 <span className="text-[#e8531a]">GRILL</span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => (
            <button
              key={n.view}
              onClick={() => handleNav(n.view)}
              className={cn(
                'text-sm font-medium uppercase tracking-wider transition-colors hover:text-[#e8531a]',
                view === n.view ? 'text-[#e8531a]' : 'text-[#f5f0e8]/80'
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Cart with count — outlined box (ZIP 1) */}
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#F5F0E8] transition-all hover:border-[#E8531A]/60 hover:text-[#E8531A]"
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingBag className="h-4 w-4" />
            Cart
            <span className="font-mono text-[#E8531A]">{cartCount}</span>
          </button>

          {/* Sign In — plain text link (ZIP 1) */}
          {status === 'loading' ? (
            <div className="h-6 w-16 animate-pulse rounded bg-white/10" />
          ) : session?.user ? (
            <button
              onClick={() => handleNav('account')}
              className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[#888] transition-colors hover:text-[#F5F0E8] sm:inline"
            >
              Account
            </button>
          ) : (
            <button
              onClick={() => handleNav('login')}
              className="hidden text-xs font-bold uppercase tracking-[0.18em] text-[#888] transition-colors hover:text-[#F5F0E8] sm:inline"
            >
              Sign In
            </button>
          )}

          {/* Checkout — solid orange button, always visible (ZIP 1) */}
          <button
            onClick={() => handleNav(session?.user ? 'checkout' : 'login')}
            className="hidden bg-[#E8531A] px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.18em] text-white transition-all hover:bg-[#E8531A]/90 hover:shadow-lg hover:shadow-[#E8531A]/25 sm:inline-flex"
          >
            Checkout
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center border border-white/10 text-[#F5F0E8] md:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="border-t border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-3">
            {NAV.map((n) => (
              <button
                key={n.view}
                onClick={() => handleNav(n.view)}
                className={cn(
                  'block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium uppercase tracking-wider',
                  view === n.view
                    ? 'bg-[#e8531a]/10 text-[#e8531a]'
                    : 'text-[#f5f0e8]/80 hover:bg-white/5'
                )}
              >
                {n.label}
              </button>
            ))}
            {session?.user && (
              <button
                onClick={() => handleNav('account')}
                className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium uppercase tracking-wider text-[#f5f0e8]/80 hover:bg-white/5"
              >
                Account
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
