'use client';

import { useState, useEffect, useRef } from 'react';
import { useUI } from '@/store/ui';
import { authClient } from '@/lib/auth/client';
import { formatPrice, shortId } from '@/lib/format';
import { ImageWithFallback } from './image-fallback';
import { ArrowLeft, CheckCircle2, Loader2, Receipt, MapPin, Clock, ChefHat, Package, Truck, XCircle, Star } from 'lucide-react';

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  stripeId: string | null;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    menuItem: { name: string; imageUrl: string; category: string };
  }[];
}

const STATUS_FLOW = ['pending', 'paid', 'preparing', 'ready', 'delivered'] as const;
type FlowStatus = typeof STATUS_FLOW[number];

const STATUS_META: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  pending:   { label: 'Order placed',  icon: Receipt,      description: 'Your order is being processed' },
  paid:      { label: 'Payment confirmed', icon: CheckCircle2, description: 'Payment received — firing up the grill' },
  preparing: { label: 'Preparing',     icon: ChefHat,      description: 'The kitchen is working on your order' },
  ready:     { label: 'Ready!',        icon: Package,      description: 'Your order is ready for pickup' },
  delivered: { label: 'Complete',      icon: Truck,        description: 'Enjoy your meal!' },
  cancelled: { label: 'Cancelled',     icon: XCircle,      description: 'This order was cancelled' },
};

function StatusProgress({ status }: { status: string }) {
  const currentIdx = STATUS_FLOW.indexOf(status as FlowStatus);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
        <XCircle className="h-5 w-5 shrink-0 text-red-400" />
        <p className="text-sm font-semibold text-red-400">Order cancelled</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
      <div className="relative">
        {/* Track line */}
        <div className="absolute left-4 top-4 h-0.5 w-[calc(100%-2rem)] bg-white/10" />
        <div
          className="absolute left-4 top-4 h-0.5 bg-[#e8531a] transition-all duration-700"
          style={{
            width: currentIdx <= 0
              ? '0%'
              : `${(currentIdx / (STATUS_FLOW.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        <div className="relative flex justify-between">
          {STATUS_FLOW.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            return (
              <div key={s} className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    done
                      ? 'border-[#e8531a] bg-[#e8531a]'
                      : active
                      ? 'border-[#e8531a] bg-[#e8531a]/20'
                      : 'border-white/15 bg-[#0d0d0d]'
                  }`}
                >
                  {active ? (
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#e8531a]" />
                  ) : done ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-[#555]" />
                  )}
                </div>
                <span className={`hidden text-[10px] font-semibold uppercase tracking-wider sm:block ${
                  active ? 'text-[#e8531a]' : done ? 'text-[#888]' : 'text-[#444]'
                }`}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current status description */}
      {STATUS_META[status] && (
        <p className="mt-4 text-center text-xs text-[#888888]">
          {STATUS_META[status].description}
        </p>
      )}
    </div>
  );
}

export function OrderConfirmationView() {
  const { orderId, setView } = useUI();
  const { data: authSession, isPending: authPending } = authClient.useSession();
  const authStatus = authPending ? 'loading' : authSession ? 'authenticated' : 'unauthenticated';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [feedback, setFeedback] = useState<{ foodRating: number; serviceRating: number; comment: string } | null>(null);
  const [feedbackDone, setFeedbackDone] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const fetchOrder = async (cancelled: { value: boolean }) => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      if (cancelled.value) return;
      if (!res.ok) throw new Error(data.error || 'Failed to load order');
      setOrder(data.order);
      // Stop polling once terminal state reached
      if (['delivered', 'cancelled'].includes(data.order.status)) {
        if (pollRef.current) clearInterval(pollRef.current);
        // Check if feedback already submitted
        if (data.order.status === 'delivered') {
          fetch(`/api/feedback?orderId=${data.order.id}`)
            .then((r) => r.json())
            .then((d) => { if (d.feedback) setFeedbackDone(true); })
            .catch(() => {});
        }
      }
    } catch (e: any) {
      if (!cancelled.value) setError(e.message);
    } finally {
      if (!cancelled.value) setLoading(false);
    }
  };

  useEffect(() => {
    if (authStatus === 'unauthenticated') { setView('login'); return; }
    if (!orderId) { setError('No order specified'); setLoading(false); return; }
    if (authStatus !== 'authenticated') return;

    const cancelled = { value: false };
    fetchOrder(cancelled);

    // Poll every 10 seconds for status updates
    pollRef.current = setInterval(() => fetchOrder(cancelled), 10_000);

    return () => {
      cancelled.value = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, authStatus]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#e8531a]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-[#888888]">{error || 'Order not found'}</p>
        <button
          onClick={() => setView('account')}
          className="rounded-lg bg-[#e8531a] px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-[#0d0d0d]"
        >
          Go to account
        </button>
      </div>
    );
  }

  const SERVICE_FEE = 1.5;
  const tax = Math.round((order.total - SERVICE_FEE) * (8 / 108) * 100) / 100;
  const subtotal = Math.round((order.total - tax - SERVICE_FEE) * 100) / 100;

  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => setView('account')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#888888] transition-colors hover:text-[#e8531a]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to account
        </button>

        {/* Success banner */}
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="font-display text-4xl tracking-wide text-[#f5f0e8]">
            ORDER <span className="text-[#e8531a]">CONFIRMED</span>
          </h1>
          <p className="mt-1 text-sm text-[#888888]">
            Thanks for your order. We&apos;re firing up the grill.
          </p>
        </div>

        {/* Live status progress */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#888888]">
              Order Status
            </p>
            <span className="flex items-center gap-1 text-xs text-[#555]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e8531a]" />
              Live
            </span>
          </div>
          <StatusProgress status={order.status} />
        </div>

        {/* Feedback prompt — only when delivered */}
        {order.status === 'delivered' && (
          <div className="mt-6 rounded-2xl border border-[#e8531a]/20 bg-[#e8531a]/5 p-6">
            {feedbackDone ? (
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/15">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <p className="font-semibold text-[#f5f0e8]">Thanks for your feedback!</p>
                <p className="mt-1 text-xs text-[#888]">Your review helps us improve.</p>
              </div>
            ) : (
              <>
                <h3 className="mb-1 text-center text-sm font-bold uppercase tracking-wider text-[#f5f0e8]">
                  How was your experience?
                </h3>
                <p className="mb-5 text-center text-xs text-[#888]">Takes 10 seconds — really helps us out.</p>
                <div className="space-y-4">
                  <StarRatingRow
                    label="Food quality"
                    value={feedback?.foodRating ?? 0}
                    onChange={(v) => setFeedback((f) => ({ foodRating: v, serviceRating: f?.serviceRating ?? 0, comment: f?.comment ?? '' }))}
                  />
                  <StarRatingRow
                    label="Service"
                    value={feedback?.serviceRating ?? 0}
                    onChange={(v) => setFeedback((f) => ({ foodRating: f?.foodRating ?? 0, serviceRating: v, comment: f?.comment ?? '' }))}
                  />
                  <textarea
                    rows={2}
                    placeholder="Anything else? (optional)"
                    value={feedback?.comment ?? ''}
                    onChange={(e) => setFeedback((f) => ({ foodRating: f?.foodRating ?? 0, serviceRating: f?.serviceRating ?? 0, comment: e.target.value }))}
                    className="w-full resize-none rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2 text-sm text-[#f5f0e8] outline-none placeholder:text-[#444] focus:border-[#e8531a]/50"
                  />
                  <button
                    disabled={!feedback?.foodRating || !feedback?.serviceRating || feedbackSubmitting}
                    onClick={async () => {
                      if (!feedback?.foodRating || !feedback?.serviceRating) return;
                      setFeedbackSubmitting(true);
                      try {
                        await fetch('/api/feedback', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: order.id, ...feedback }),
                        });
                        setFeedbackDone(true);
                      } finally {
                        setFeedbackSubmitting(false);
                      }
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-3 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff6b2c] disabled:opacity-50"
                  >
                    {feedbackSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                    Submit Review
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Order meta */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Meta icon={<Receipt className="h-4 w-4" />} label="Order ID" value={`#${shortId(order.id)}`} mono />
            <Meta
              icon={<Clock className="h-4 w-4" />}
              label="Placed"
              value={new Date(order.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            />
            <Meta
              icon={<MapPin className="h-4 w-4" />}
              label="Pickup"
              value="828 Grill, Asheville NC"
            />
          </div>
        </div>

        {/* Items */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#f5f0e8]">Items</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#0d0d0d]">
                  <ImageWithFallback
                    src={item.menuItem.imageUrl}
                    alt={item.menuItem.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#f5f0e8]">{item.menuItem.name}</p>
                  <p className="text-xs text-[#888888]">{item.quantity} × {formatPrice(item.unitPrice)}</p>
                </div>
                <span className="font-data text-sm font-bold text-[#f5f0e8]">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between text-[#888888]">
              <span>Subtotal</span>
              <span className="font-data text-[#f5f0e8]">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#888888]">
              <span>Tax</span>
              <span className="font-data text-[#f5f0e8]">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-[#888888]">
              <span>Service fee</span>
              <span className="font-data text-[#f5f0e8]">{formatPrice(SERVICE_FEE)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-white/10 pt-2">
              <span className="font-display text-lg tracking-wider text-[#f5f0e8]">TOTAL PAID</span>
              <span className="font-data text-lg font-bold text-[#e8531a]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => setView('menu')}
            className="flex-1 rounded-lg bg-[#e8531a] py-3.5 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff6b2c]"
          >
            Order Again
          </button>
          <button
            onClick={() => setView('account')}
            className="flex-1 rounded-lg border border-white/15 py-3.5 text-sm font-bold uppercase tracking-wider text-[#f5f0e8] transition-colors hover:border-[#e8531a]/50 hover:text-[#e8531a]"
          >
            View All Orders
          </button>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#888888]">
        {icon}{label}
      </div>
      <p className={`text-sm font-bold text-[#f5f0e8] ${mono ? 'font-data text-[#e8531a]' : ''}`}>{value}</p>
    </div>
  );
}

function StarRatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-[#f5f0e8]">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${n <= value ? 'fill-[#e8531a] text-[#e8531a]' : 'text-[#444]'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
