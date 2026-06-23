'use client';

import { useState, useEffect } from 'react';
import { useUI } from '@/store/ui';
import { authClient } from '@/lib/auth/client';
import { formatPrice, shortId } from '@/lib/format';
import { ImageWithFallback } from './image-fallback';
import { ArrowLeft, CheckCircle2, Loader2, Receipt, MapPin, Clock, Flame } from 'lucide-react';

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

export function OrderConfirmationView() {
  const { orderId, setView } = useUI();
  const { data: authSession, isPending: authPending } = authClient.useSession();
  const authStatus = authPending ? 'loading' : authSession ? 'authenticated' : 'unauthenticated';
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      setView('login');
      return;
    }
    if (!orderId) {
      setError('No order specified');
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || 'Failed to load order');
        setOrder(data.order);
      } catch (e: any) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId, authStatus, setView]);

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

        {/* Order meta */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Meta icon={<Receipt className="h-4 w-4" />} label="Order ID" value={`#${shortId(order.id)}`} mono />
            <Meta icon={<Flame className="h-4 w-4" />} label="Status" value={order.status} />
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
              value="Ready in ~20m"
            />
          </div>
        </div>

        {/* Items */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#f5f0e8]">
            Items
          </h2>
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
                  <p className="truncate text-sm font-semibold text-[#f5f0e8]">
                    {item.menuItem.name}
                  </p>
                  <p className="text-xs text-[#888888]">
                    {item.quantity} × {formatPrice(item.unitPrice)}
                  </p>
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
              <span className="font-data text-[#f5f0e8]">{formatPrice(1.5)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-white/10 pt-2">
              <span className="font-display text-lg tracking-wider text-[#f5f0e8]">
                TOTAL PAID
              </span>
              <span className="font-data text-lg font-bold text-[#e8531a]">
                {formatPrice(order.total)}
              </span>
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

function Meta({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#888888]">
        {icon}
        {label}
      </div>
      <p className={`text-sm font-bold capitalize text-[#f5f0e8] ${mono ? 'font-data text-[#e8531a]' : ''}`}>
        {value}
      </p>
    </div>
  );
}
