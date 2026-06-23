'use client';

import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { authClient } from '@/lib/auth/client';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import { ImageWithFallback } from './image-fallback';

const TAX_RATE = 0.08;
const SERVICE_FEE = 1.5;

export function CartDrawer() {
  const { items, setQty, remove, clear, subtotal } = useCart();
  const { cartOpen, setCartOpen, setView } = useUI();
  const { data: session } = authClient.useSession();
  const { toast } = useToast();

  const sub = subtotal();
  const tax = Math.round(sub * TAX_RATE * 100) / 100;
  const fee = items.length > 0 ? SERVICE_FEE : 0;
  const total = Math.round((sub + tax + fee) * 100) / 100;

  const goToCheckout = () => {
    if (items.length === 0) {
      toast({ title: 'Your cart is empty', variant: 'destructive' });
      return;
    }
    if (!session?.user) {
      setCartOpen(false);
      setView('login');
      toast({
        title: 'Please sign in to checkout',
        description: 'You need an account to place an order.',
      });
      return;
    }
    setCartOpen(false);
    setView('checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          cartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setCartOpen(false)}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0d0d0d] shadow-2xl transition-transform duration-300 ${
          cartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#e8531a]" />
            <h2 className="font-display text-2xl tracking-wider text-[#f5f0e8]">
              YOUR ORDER
            </h2>
          </div>
          <button
            onClick={() => setCartOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#f5f0e8] transition-colors hover:border-[#e8531a]/50 hover:text-[#e8531a]"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10">
              <ShoppingBag className="h-7 w-7 text-[#888888]" />
            </div>
            <div>
              <p className="font-display text-xl tracking-wider text-[#f5f0e8]">
                CART&apos;S EMPTY
              </p>
              <p className="mt-1 text-sm text-[#888888]">
                Add some fire to your order.
              </p>
            </div>
            <button
              onClick={() => {
                setCartOpen(false);
                setView('menu');
              }}
              className="mt-2 rounded-lg bg-[#e8531a] px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff6b2c]"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="scroll-area-dark flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-3">
              {items.map((line) => (
                <div
                  key={line.id}
                  className="flex gap-3 rounded-xl border border-white/10 bg-[#1a1a1a] p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#141414]">
                    <ImageWithFallback
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-[#f5f0e8]">
                        {line.name}
                      </h3>
                      <button
                        onClick={() => remove(line.id)}
                        className="shrink-0 text-[#888888] transition-colors hover:text-red-400"
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-[#888888]">{line.category}</p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1 rounded-lg border border-white/10">
                        <button
                          onClick={() => setQty(line.id, line.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center text-[#f5f0e8] transition-colors hover:text-[#e8531a]"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center font-data text-sm text-[#f5f0e8]">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => setQty(line.id, line.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center text-[#f5f0e8] transition-colors hover:text-[#e8531a]"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="font-data text-sm font-bold text-[#e8531a]">
                        {formatPrice(line.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={clear}
              className="mt-4 w-full rounded-lg border border-white/10 py-2 text-xs font-semibold uppercase tracking-wider text-[#888888] transition-colors hover:border-red-500/40 hover:text-red-400"
            >
              Clear cart
            </button>
          </div>
        )}

        {/* Summary + checkout */}
        {items.length > 0 && (
          <div className="border-t border-white/10 bg-[#141414] px-5 py-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#888888]">
                <span>Subtotal</span>
                <span className="font-data text-[#f5f0e8]">{formatPrice(sub)}</span>
              </div>
              <div className="flex justify-between text-[#888888]">
                <span>Tax (8%)</span>
                <span className="font-data text-[#f5f0e8]">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-[#888888]">
                <span>Service fee</span>
                <span className="font-data text-[#f5f0e8]">{formatPrice(fee)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-white/10 pt-2">
                <span className="font-display text-lg tracking-wider text-[#f5f0e8]">
                  TOTAL
                </span>
                <span className="font-data text-lg font-bold text-[#e8531a]">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <button
              onClick={goToCheckout}
              className="group mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-3.5 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-all hover:bg-[#ff6b2c] active:scale-[0.99] ember-glow"
            >
              {session?.user ? 'Checkout' : 'Sign in to checkout'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
