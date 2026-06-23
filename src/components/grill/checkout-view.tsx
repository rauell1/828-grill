'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useCart } from '@/store/cart';
import { useUI } from '@/store/ui';
import { authClient } from '@/lib/auth/client';
import { formatPrice } from '@/lib/format';
import { ArrowLeft, Lock, CreditCard, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from './image-fallback';

const TAX_RATE = 0.08;
const SERVICE_FEE = 1.5;

// Stripe instance — only created if key is configured
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Stripe Elements inner form ────────────────────────────────────────────────
function StripePayForm({
  total,
  orderId,
  onSuccess,
}: {
  total: number;
  orderId: string;
  onSuccess: (order: any) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setErrMsg('');

    const { error: submitErr } = await elements.submit();
    if (submitErr) {
      setErrMsg(submitErr.message ?? 'Payment error');
      setProcessing(false);
      return;
    }

    // Confirm the payment — Stripe sends webhook on success
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrMsg(error.message ?? 'Payment failed');
      setProcessing(false);
      return;
    }

    // Payment succeeded — confirm server-side to mark order paid
    try {
      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Confirmation failed');
      onSuccess(data.order);
    } catch (err: any) {
      setErrMsg(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />
      {errMsg && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{errMsg}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-4 text-base font-bold uppercase tracking-wider text-[#0d0d0d] transition-all hover:bg-[#ff6b2c] active:scale-[0.99] disabled:opacity-60 ember-glow"
      >
        {processing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay {formatPrice(total)}
          </>
        )}
      </button>
    </form>
  );
}

// ── Mock card form (fallback when Stripe is not configured) ───────────────────
function MockPayForm({
  total,
  orderId,
  stripeId,
  onSuccess,
}: {
  total: number;
  orderId: string;
  stripeId: string;
  onSuccess: (order: any) => void;
}) {
  const [card, setCard] = useState({ number: '', exp: '', cvc: '', name: '' });
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (card.number.replace(/\s/g, '').length < 16) {
      toast.error('Enter a valid 16-digit card number');
      return;
    }
    if (card.exp.length < 5) { toast.error('Enter a valid expiry (MM/YY)'); return; }
    if (card.cvc.length < 3) { toast.error('Enter a valid CVC'); return; }

    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1600));

    try {
      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, sessionId: stripeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment failed');
      onSuccess(data.order);
    } catch (err: any) {
      toast.error(err.message || 'Checkout failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
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
      <div className="flex items-center gap-2 rounded-lg border border-[#e8531a]/20 bg-[#e8531a]/5 px-3 py-2.5 text-xs text-[#f5f0e8]/70">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#e8531a]" />
        Test mode — use card{' '}
        <span className="font-data text-[#e8531a]">4242 4242 4242 4242</span>, any future date, any CVC.
      </div>
      <button
        type="submit"
        disabled={processing}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-4 text-base font-bold uppercase tracking-wider text-[#0d0d0d] transition-all hover:bg-[#ff6b2c] active:scale-[0.99] disabled:opacity-60 ember-glow"
      >
        {processing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay {formatPrice(total)}
          </>
        )}
      </button>
    </form>
  );
}

// ── Main CheckoutView ─────────────────────────────────────────────────────────
export function CheckoutView() {
  const { items, subtotal, clear } = useCart();
  const { setView, setOrderId, orderId } = useUI();
  const { data: session } = authClient.useSession();

  const [step, setStep] = useState<'form' | 'creating' | 'done'>('form');
  const [orderData, setOrderData] = useState<any>(null);
  const [pendingOrder, setPendingOrder] = useState<{
    id: string; stripeId: string; clientSecret: string | null; stripeEnabled: boolean;
  } | null>(null);
  const [delivery, setDelivery] = useState({ phone: '', address: '' });

  const sub = subtotal();
  const tax = Math.round(sub * TAX_RATE * 100) / 100;
  const fee = items.length > 0 ? SERVICE_FEE : 0;
  const total = Math.round((sub + tax + fee) * 100) / 100;

  useEffect(() => {
    if (items.length === 0 && step !== 'done' && !orderId) setView('menu');
  }, [items.length, step, orderId, setView]);

  useEffect(() => {
    if (session === null) setView('login');
  }, [session, setView]);

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#e8531a]" />
      </div>
    );
  }

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('creating');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start checkout');
      setPendingOrder({
        id: data.order.id,
        stripeId: data.session.id,
        clientSecret: data.session.clientSecret,
        stripeEnabled: data.stripeEnabled,
      });
      setStep('form');
    } catch (err: any) {
      setStep('form');
      toast.error(err.message || 'Checkout failed. Please try again.');
    }
  };

  const handlePaymentSuccess = (order: any) => {
    setOrderData(order);
    setOrderId(order.id);
    setStep('done');
    clear();
    toast.success('Payment successful!');
  };

  // ── Done ──────────────────────────────────────────────────────────────────
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
              <span className="font-data font-bold text-[#f5f0e8]">{formatPrice(orderData.total)}</span>
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

  // ── Creating order ────────────────────────────────────────────────────────
  if (step === 'creating') {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-[#e8531a]" />
          <h2 className="mt-5 font-display text-3xl tracking-wide text-[#f5f0e8]">
            PREPARING ORDER
          </h2>
          <p className="mt-2 text-sm text-[#888888]">Setting up secure payment…</p>
        </div>
      </div>
    );
  }

  // ── Checkout form ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => setView('menu')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#888888] transition-colors hover:text-[#e8531a]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to menu
        </button>

        <h1 className="font-display text-5xl tracking-wide text-[#f5f0e8] sm:text-6xl">CHECKOUT</h1>
        <p className="mt-1 text-sm text-[#888888]">Review your order and pay securely.</p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Payment form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
              <div className="mb-5 flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#e8531a]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#f5f0e8]">
                  Secure Payment
                  {pendingOrder?.stripeEnabled && (
                    <span className="ml-2 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-400">
                      Stripe
                    </span>
                  )}
                </h2>
              </div>

              {/* Contact info (only before order is created) */}
              {!pendingOrder && (
                <form onSubmit={handleCreateOrder}>
                  <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888888]">
                        Phone
                      </label>
                      <input
                        type="tel"
                        inputMode="tel"
                        placeholder="+1 (555) 000-0000"
                        value={delivery.phone}
                        onChange={(e) => setDelivery({ ...delivery, phone: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888888]">
                        Pickup / Delivery Address
                      </label>
                      <input
                        type="text"
                        placeholder="123 Main St, Asheville, NC"
                        value={delivery.address}
                        onChange={(e) => setDelivery({ ...delivery, address: e.target.value })}
                        className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                      />
                    </div>
                  </div>
                  <div className="mb-6 border-t border-white/10" />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-4 text-base font-bold uppercase tracking-wider text-[#0d0d0d] transition-all hover:bg-[#ff6b2c] active:scale-[0.99] ember-glow"
                  >
                    <Lock className="h-4 w-4" />
                    Continue to Payment · {formatPrice(total)}
                  </button>
                </form>
              )}

              {/* Payment section — shown after order is created */}
              {pendingOrder && (
                <>
                  {pendingOrder.stripeEnabled && stripePromise && pendingOrder.clientSecret ? (
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret: pendingOrder.clientSecret,
                        appearance: {
                          theme: 'night',
                          variables: {
                            colorPrimary: '#e8531a',
                            colorBackground: '#0d0d0d',
                            colorText: '#f5f0e8',
                            borderRadius: '8px',
                          },
                        },
                      }}
                    >
                      <StripePayForm
                        total={total}
                        orderId={pendingOrder.id}
                        onSuccess={handlePaymentSuccess}
                      />
                    </Elements>
                  ) : (
                    <MockPayForm
                      total={total}
                      orderId={pendingOrder.id}
                      stripeId={pendingOrder.stripeId}
                      onSuccess={handlePaymentSuccess}
                    />
                  )}
                  <button
                    onClick={() => setPendingOrder(null)}
                    className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-[#666] hover:text-[#e8531a]"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back to details
                  </button>
                </>
              )}
            </div>
          </div>

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
                      <p className="truncate text-sm font-medium text-[#f5f0e8]">{line.name}</p>
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
