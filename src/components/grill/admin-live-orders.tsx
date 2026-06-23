'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2, RefreshCw, ChefHat, Package, Truck,
  XCircle, Clock, Flame, Phone, MessageSquare, Bell,
} from 'lucide-react';

interface LiveOrderItem { name: string; quantity: number; }

interface LiveOrder {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  notes?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalUnits: number;
  items: LiveOrderItem[];
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:   { label: 'Pending',   bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  paid:      { label: 'Paid',      bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  preparing: { label: 'Preparing', bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400' },
  ready:     { label: 'Ready',     bg: 'bg-green-500/10',  text: 'text-green-400',  dot: 'bg-green-400' },
};

const NEXT_STATUS: Record<string, { status: string; label: string; icon: any }> = {
  pending:   { status: 'preparing', label: 'Mark Preparing', icon: ChefHat },
  paid:      { status: 'preparing', label: 'Mark Preparing', icon: ChefHat },
  confirmed: { status: 'preparing', label: 'Mark Preparing', icon: ChefHat },
  preparing: { status: 'ready',     label: 'Mark Ready',     icon: Package },
  ready:     { status: 'delivered', label: 'Mark Delivered', icon: Truck },
};

const STATUS_ORDER = ['pending', 'paid', 'confirmed', 'preparing', 'ready'];

function elapsedLabel(createdAt: string): { label: string; urgency: 'ok' | 'warn' | 'hot' } {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  const label = mins < 1 ? 'Just now' : mins === 1 ? '1 min ago' : `${mins} min ago`;
  const urgency = mins < 8 ? 'ok' : mins < 18 ? 'warn' : 'hot';
  return { label, urgency };
}

const URGENCY_STYLE = {
  ok:   'text-green-400 bg-green-400/10',
  warn: 'text-yellow-400 bg-yellow-400/10',
  hot:  'text-red-400 bg-red-400/10 animate-pulse',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

function OrderCard({
  order,
  onAdvance,
  onCancel,
}: {
  order: LiveOrder;
  onAdvance: (id: string, status: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
}) {
  const [advancing, setAdvancing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const next = NEXT_STATUS[order.status];
  const { label: timeLabel, urgency } = elapsedLabel(order.createdAt);
  const meta = STATUS_META[order.status];
  const NextIcon = next?.icon ?? Package;

  const handleAdvance = async () => {
    if (!next) return;
    setAdvancing(true);
    await onAdvance(order.id, next.status);
    setAdvancing(false);
  };

  const handleCancel = async () => {
    setCancelling(true);
    await onCancel(order.id);
    setCancelling(false);
  };

  return (
    <div className={`rounded-xl border border-white/10 bg-[#1a1a1a] overflow-hidden transition-all`}>
      {/* Status stripe */}
      <div className={`h-1 w-full ${meta?.dot ? meta.dot : 'bg-white/10'}`} />

      <div className="p-4 sm:p-5">
        {/* Top row: ID + status + time */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-data text-sm font-bold text-[#e8531a]">
            #{order.id.slice(-8).toUpperCase()}
          </span>
          {meta && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text}`}>
              {meta.label}
            </span>
          )}
          <span className={`ml-auto flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${URGENCY_STYLE[urgency]}`}>
            {urgency === 'hot' && <Flame className="h-3 w-3" />}
            {urgency !== 'hot' && <Clock className="h-3 w-3" />}
            {timeLabel}
          </span>
        </div>

        {/* Customer */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
          <span className="font-semibold text-[#f5f0e8]">{order.customerName}</span>
          {order.customerPhone && (
            <a
              href={`tel:${order.customerPhone}`}
              className="flex items-center gap-1 text-xs text-[#888] hover:text-[#e8531a]"
            >
              <Phone className="h-3 w-3" />
              {order.customerPhone}
            </a>
          )}
        </div>

        {/* Items */}
        <p className="mt-2 text-sm text-[#888]">
          {order.items.map((i) => `${i.quantity}× ${i.name}`).join(' · ')}
        </p>

        {/* Notes */}
        {order.notes && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/6 px-3 py-2 text-xs">
            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-yellow-400" />
            <span className="text-yellow-200/90">{order.notes}</span>
          </div>
        )}

        {/* Footer: total + actions */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-data text-sm font-bold text-[#f5f0e8]">{fmt(order.total)}</span>
          <span className="text-xs text-[#555]">{order.totalUnits} item{order.totalUnits !== 1 ? 's' : ''}</span>

          <div className="ml-auto flex items-center gap-2">
            {/* Cancel */}
            <button
              onClick={handleCancel}
              disabled={cancelling || advancing}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
            >
              {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Cancel
            </button>

            {/* Next step — primary CTA */}
            {next && (
              <button
                onClick={handleAdvance}
                disabled={advancing || cancelling}
                className="flex items-center gap-2 rounded-lg bg-[#e8531a] px-4 py-2 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition hover:bg-[#ff6b2c] active:scale-[0.98] disabled:opacity-50 ember-glow"
              >
                {advancing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <NextIcon className="h-4 w-4" />
                )}
                {next.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const REFRESH_SECS = 30;

export function AdminLiveOrders() {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_SECS);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const prevIds = useRef<Set<string>>(new Set());

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/orders?live=1');
      if (!res.ok) return;
      const data = await res.json();
      const incoming: LiveOrder[] = data.orders ?? [];

      // detect new orders since last fetch
      const incomingIds = new Set(incoming.map((o) => o.id));
      const fresh = incoming.filter((o) => !prevIds.current.has(o.id));
      if (fresh.length > 0 && prevIds.current.size > 0) {
        setNewOrderIds(new Set(fresh.map((o) => o.id)));
        setTimeout(() => setNewOrderIds(new Set()), 4000);
      }
      prevIds.current = incomingIds;

      // sort: STATUS_ORDER priority, then oldest first within group
      incoming.sort((a, b) => {
        const ai = STATUS_ORDER.indexOf(a.status);
        const bi = STATUS_ORDER.indexOf(b.status);
        if (ai !== bi) return ai - bi;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      setOrders(incoming);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // initial load
  useEffect(() => { load(); }, [load]);

  // auto-refresh countdown
  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          load();
          return REFRESH_SECS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [load]);

  const handleAdvance = async (id: string, status: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.filter((o) => {
      if (o.id !== id) return true;
      // remove from live board if delivered/cancelled
      return !['delivered', 'cancelled'].includes(status);
    }).map((o) => o.id === id ? { ...o, status } : o));
  };

  const handleCancel = async (id: string) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const activeCount = orders.length;

  // group by status for section headers
  const groups: { status: string; label: string; orders: LiveOrder[] }[] = [];
  const seen = new Set<string>();
  for (const o of orders) {
    if (!seen.has(o.status)) {
      seen.add(o.status);
      groups.push({ status: o.status, label: STATUS_META[o.status]?.label ?? o.status, orders: [] });
    }
    groups[groups.length - 1].orders.push(o);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl tracking-wider text-[#f5f0e8]">LIVE ORDERS</h2>
          {activeCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#e8531a] px-3 py-1 text-xs font-bold text-[#0d0d0d]">
              <Bell className="h-3 w-3" />
              {activeCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#555]">
            Refresh in <span className="font-data font-bold text-[#888]">{countdown}s</span>
          </span>
          <button
            onClick={() => { load(true); setCountdown(REFRESH_SECS); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs font-semibold text-[#888] transition hover:border-[#e8531a]/50 hover:text-[#e8531a] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#e8531a]" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <Package className="h-7 w-7 text-green-400" />
          </div>
          <p className="font-display text-2xl tracking-wider text-[#f5f0e8]">ALL CLEAR</p>
          <p className="text-sm text-[#555]">No active orders right now.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.status}>
              {/* Group header */}
              <div className="mb-3 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${STATUS_META[group.status]?.dot ?? 'bg-white/20'}`} />
                <span className={`text-xs font-bold uppercase tracking-widest ${STATUS_META[group.status]?.text ?? 'text-[#888]'}`}>
                  {group.label}
                </span>
                <span className="text-xs text-[#555]">({group.orders.length})</span>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
                {group.orders.map((order) => (
                  <div
                    key={order.id}
                    className={newOrderIds.has(order.id) ? 'ring-2 ring-[#e8531a] rounded-xl animate-pulse' : ''}
                  >
                    <OrderCard
                      order={order}
                      onAdvance={handleAdvance}
                      onCancel={handleCancel}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
