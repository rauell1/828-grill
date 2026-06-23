'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { useSession } from 'next-auth/react';
import { formatPrice } from '@/lib/format';
import { ArrowLeft, Lock, CreditCard, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from './image-fallback';

const TAX_RATE = 0.08;
const SERVICE_FEE = 1.5;

export function CheckoutView() {
  const { items, subtotal, clear } = useCart();
  const { setView, setOrderId, orderId } = useUI();
  const { data: session } = useSession();

  const [step, setStep] = useState<'form' | 'processing' | 'done'>('form');
  const [orderData, setOrderData] = useState<any>(null);
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: '' });

  const sub = subtotal();
  const tax = Math.round(sub * TAX_RATE * 100) / 100;
  const fee = items.length > 0 ? SERVICE_FEE : 0;
  const total = Math.round((sub + tax + fee) * 100) / 100;

  // If cart emptied (e.g. after returning from confirmation), bounce to menu
  useEffect(() => {
    if (items.length === 0 && step !== 'done' && !orderId) {
      setView('menu');
    }
  }, [items.length, step, orderId, setView]);

  // Redirect to login if not authenticated (avoid setState during render)
  useEffect(() => {
    if (session === null) {
      setView('login');
    }
  }, [session, setView]);

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#e8531a]" />
      </div>
    );
  }

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (card.number.replace(/\s/g, '').length < 16) {
      toast.error('Enter a valid 16-digit card number');
      return;
    }
    if (card.exp.length < 5) {
      toast.error('Enter a valid expiry date (MM/YY)');
      return;
    }
    if (card.cvc.length < 3) {
      toast.error('Enter a valid CVC');
      return;
    }

    setStep('processing');

    try {
      // 1. Create the order (mock Stripe session)
      const createRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || 'Failed to start checkout');
      }

      // Simulate payment processing delay
      await new Promise((r) => setTimeout(r, 1800));

      // 2. Confirm payment (mock webhook)
      const confirmRes = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createData.order.id,
          sessionId: createData.session.id,
        }),
      });
      const confirmData = await confirmRes.json();
      if (!confirmRes.ok) {
        throw new Error(confirmData.error || 'Payment failed');
      }

      setOrderData(confirmData.order);
      setOrderId(confirmData.order.id);
      setStep('done');
      clear();
      toast.success('Payment successful!');
    } catch (err: any) {
      setStep('form');
      toast.error(err.message || 'Checkout failed. Please try again.');
    }
  };

  // Success state
  if (step === 'done' && orderData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1a1a1a] p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle2 className="h-9 w-9 text-green-500" />
          </div>
          <h1 className="font-display text-4xl tracking-wide text-[#f5f0e8]">
            ORDER <span className="text-[#e8531a]">CONFIRMED</span>
          </h1>
          <p className="mt-2 text-sm text-[#888888]">
            Your payment went through. We&apos;re firing up the grill.
          </p>
          <div className="mt-5 rounded-lg border border-white/10 bg-[#0d0d0d] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#888888]">Order ID</span>
              <span className="font-data text-[#e8531a]">
                #{orderData.id.slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="mt-2 flex justify-between text-sm">
              <span className="text-[#888888]">Total paid</span>
              <span className="font-data font-bold text-[#f5f0e8]">
                {formatPrice(orderData.total)}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => setView('order')}
              className="flex-1 rounded-lg bg-[#e8531a] py-3 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff6b2c]"
            >
              View Receipt
            </button>
            <button
              onClick={() => setView('menu')}
              className="flex-1 rounded-lg border border-white/15 py-3 text-sm font-bold uppercase tracking-wider text-[#f5f0e8] transition-colors hover:border-[#e8531a]/50 hover:text-[#e8531a]"
            >
              Order More
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing state
  if (step === 'processing') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#e8531a]" />
          <h2 className="mt-5 font-display text-3xl tracking-wide text-[#f5f0e8]">
            PROCESSING PAYMENT
          </h2>
          <p className="mt-2 text-sm text-[#888888]">
            Securely contacting the payment network…
          </p>
        </div>
      </div>
    );
  }

  // Checkout form
  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => setView('menu')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#888888] transition-colors hover:text-[#e8531a]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to menu
        </button>

        <h1 className="font-display text-5xl tracking-wide text-[#f5f0e8] sm:text-6xl">
          CHECKOUT
        </h1>
        <p className="mt-1 text-sm text-[#888888]">
          Review your order and pay securely.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Payment form */}
          <form onSubmit={handlePay} className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
              <div className="mb-5 flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#e8531a]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#f5f0e8]">
                  Secure Payment
                </h2>
              </div>

              {/* Contact info (pre-filled) */}
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888888]">
                    Name
                  </label>
                  <input
                    value={session.user.name || ''}
                    readOnly
                    className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888888]">
                    Email
                  </label>
                  <input
                    value={session.user.email || ''}
                    readOnly
                    className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none"
                  />
                </div>
              </div>

              {/* Card details */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888888]">
                    Card number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#888888]" />
                    <input
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] py-2.5 pl-9 pr-3 font-data text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888888]">
                    Name on card
                  </label>
                  <input
                    placeholder="JANE DOE"
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888888]">
                      Expiry
                    </label>
                    <input
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={card.exp}
                      onChange={(e) => setCard({ ...card, exp: formatExp(e.target.value) })}
                      className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 font-data text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888888]">
                      CVC
                    </label>
                    <input
                      inputMode="numeric"
                      placeholder="123"
                      value={card.cvc}
                      maxLength={4}
                      onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '') })}
                      className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 font-data text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#e8531a]/20 bg-[#e8531a]/5 px-3 py-2.5 text-xs text-[#f5f0e8]/70">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#e8531a]" />
                Test mode — use card <span className="font-data text-[#e8531a]">4242 4242 4242 4242</span>, any future date, any CVC.
              </div>

              <button
                type="submit"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-4 text-base font-bold uppercase tracking-wider text-[#0d0d0d] transition-all hover:bg-[#ff6b2c] active:scale-[0.99] ember-glow"
              >
                <Lock className="h-4 w-4" />
                Pay {formatPrice(total)}
              </button>
            </div>
          </form>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 lg:sticky lg:top-24">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#f5f0e8]">
                Order Summary
              </h2>
              <div className="scroll-area-dark max-h-64 space-y-3 overflow-y-auto pr-1">
                {items.map((line) => (
                  <div key={line.id} className="flex gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#0d0d0d]">
                      <ImageWithFallback
                        src={line.imageUrl}
                        alt={line.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#f5f0e8]">
                        {line.name}
                      </p>
                      <p className="text-xs text-[#888888]">×{line.quantity}</p>
                    </div>
                    <span className="font-data text-sm text-[#f5f0e8]">
                      {formatPrice(line.price * line.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-sm">
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
                  <span className="font-display text-lg tracking-wider text-[#f5f0e8]">TOTAL</span>
                  <span className="font-data text-lg font-bold text-[#e8531a]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
