'use client';

import { useEffect, useState } from 'react';
import { useUI } from '@/store/ui';
import { Header } from '@/components/grill/header';
import { Hero } from '@/components/grill/hero';
import { Marquee } from '@/components/grill/marquee';
import { FeaturedSection } from '@/components/grill/featured-section';
import { AboutSection } from '@/components/grill/about-section';
import { CTASection } from '@/components/grill/cta-section';
import { NewsletterSection } from '@/components/grill/newsletter-section';
import { MenuSection } from '@/components/grill/menu-section';
import { Footer } from '@/components/grill/footer';
import { CartDrawer } from '@/components/grill/cart-drawer';
import { CheckoutView } from '@/components/grill/checkout-view';
import { AuthView } from '@/components/grill/auth-view';
import { AccountView } from '@/components/grill/account-view';
import { OrderConfirmationView } from '@/components/grill/order-confirmation-view';
import { AdminView } from '@/components/grill/admin-view';
import type { MenuItemData } from '@/components/grill/menu-card';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { view } = useUI();
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/menu');
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.items) {
          setItems(data.items);
        }
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d]">
      {view !== 'admin' && <Header />}
      <CartDrawer />

      <main className="flex-1">
        {view === 'admin' && <AdminView />}

        {view !== 'admin' && view === 'home' && (
          <>
            <Hero />
            <Marquee />
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#e8531a]" />
              </div>
            ) : (
              <FeaturedSection items={items} />
            )}
            <AboutSection />
            <CTASection />
            <NewsletterSection />
          </>
        )}

        {view !== 'admin' && view === 'menu' && (
          <>
            {loading ? (
              <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#e8531a]" />
              </div>
            ) : (
              <MenuSection items={items} />
            )}
          </>
        )}

        {view !== 'admin' && view === 'checkout' && <CheckoutView />}
        {view !== 'admin' && view === 'login' && <AuthView />}
        {view !== 'admin' && view === 'register' && <AuthView />}
        {view !== 'admin' && view === 'account' && <AccountView />}
        {view !== 'admin' && view === 'order' && <OrderConfirmationView />}
      </main>

      {view !== 'admin' && view !== 'checkout' && view !== 'login' && view !== 'register' && (
        <Footer />
      )}
    </div>
  );
}
