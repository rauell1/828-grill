'use client';

import { useEffect, useState } from 'react';
import {
  Loader2, RefreshCw, ChevronDown, ChevronRight, Package,
  Clock, CheckCircle2, Truck, XCircle, ChefHat,
} from 'lucide-react';

interface OrderRow {
  id: string;
  total: number;
  status: string;
  stripeId: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  totalUnits: number;
}
interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  itemName: string;
  category: string;
  imageUrl: string;
}
interface OrderDetail {
  order: OrderRow & { customerPhone?: string; customerAddress?: string; notes?: string };
  items: OrderItem[];
}

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'Pending',   color: 'text-yellow-400 bg-yellow-400/10',  icon: Clock },
  paid:      { label: 'Paid',      color: 'text-blue-400 bg-blue-400/10',      icon: CheckCircle2 },
  confirmed: { label: 'Confirmed', color: 'text-blue-400 bg-blue-400/10',      icon: CheckCircle2 },
  preparing: { label: 'Preparing', color: 'text-orange-400 bg-orange-400/10',  icon: ChefHat },
  ready:     { label: 'Ready',     color: 'text-green-400 bg-green-400/10',    icon: Package },
  delivered: { label: 'Delivered', color: 'text-emerald-400 bg-emerald-400/10',icon: Truck },
  cancelled: { label: 'Cancelled', color: 'text-red-400 bg-red-400/10',        icon: XCircle },
};

const STATUS_FLOW = ['pending', 'paid', 'preparing', 'ready', 'delivered'] as const;
const ALL_STATUSES = Object.keys(STATUS_META);

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n ?? 0);

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, color: 'text-[#888] bg-white/5', icon: Clock };
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${m.color}`}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  );
}

function OrderRow({
  order,
  onStatusChange,
}: {
  order: OrderRow;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadDetail = async () => {
    if (detail) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`);
      if (res.ok) setDetail(await res.json());
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggle = () => {
    setExpanded((v) => !v);
    if (!expanded) loadDetail();
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onStatusChange(order.id, newStatus);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status as any) + 1];

  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] overflow-hidden">
      {/* Row header */}
      <button
        onClick={toggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
      >
        <div className="text-[#666]">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-data text-sm font-bold text-[#e8531a]">
              #{order.id.slice(-8).toUpperCase()}
            </span>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-0.5 truncate text-xs text-[#888]">
            {order.customerName} · {order.customerEmail}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-data font-bold text-[#f5f0e8]">{fmt(order.total)}</p>
          <p className="text-xs text-[#666]">
            {order.totalUnits} item{order.totalUnits !== 1 ? 's' : ''} ·{' '}
            {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/10 bg-[#0d0d0d] px-5 py-4">
          {loadingDetail ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-[#e8531a]" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              {/* Customer info */}
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                {detail.order.customerPhone && (
                  <div>
                    <p className="text-[#666]">Phone</p>
                    <p className="text-[#f5f0e8]">{detail.order.customerPhone}</p>
                  </div>
                )}
                {detail.order.customerAddress && (
                  <div className="col-span-2">
                    <p className="text-[#666]">Address</p>
                    <p className="text-[#f5f0e8]">{detail.order.customerAddress}</p>
                  </div>
                )}
                <div>
                  <p className="text-[#666]">Stripe ID</p>
                  <p className="truncate font-data text-[#f5f0e8]">
                    {detail.order.stripeId?.startsWith('mock_') ? 'Mock payment' : detail.order.stripeId}
                  </p>
                </div>
              </div>

              {/* Special instructions */}
              {detail.order.notes && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2.5">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-yellow-500/70">
                    Special instructions
                  </p>
                  <p className="text-sm text-yellow-200/90">{detail.order.notes}</p>
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                {detail.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-[#1a1a1a] px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8531a]/10 font-data text-xs font-bold text-[#e8531a]">
                        ×{item.quantity}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#f5f0e8]">{item.itemName}</p>
                        <p className="text-xs text-[#666]">{item.category}</p>
                      </div>
                    </div>
                    <p className="font-data text-sm text-[#f5f0e8]">
                      {fmt(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Status actions */}
              <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                <span className="text-xs text-[#666]">Update status:</span>
                {ALL_STATUSES.filter((s) => s !== order.status).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={updatingStatus}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      s === nextStatus
                        ? 'bg-[#e8531a] text-[#0d0d0d] hover:bg-[#ff6b2c]'
                        : 'border border-white/10 bg-[#1a1a1a] text-[#888] hover:border-[#e8531a]/40 hover:text-[#e8531a]'
                    } disabled:opacity-50`}
                  >
                    {STATUS_META[s]?.label ?? s}
                    {s === nextStatus && ' →'}
                  </button>
                ))}
                {updatingStatus && <Loader2 className="h-4 w-4 animate-spin text-[#e8531a]" />}
              </div>
            </div>
          ) : (
            <p className="py-2 text-sm text-red-400">Failed to load order details</p>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const url = statusFilter ? `/api/admin/orders?status=${statusFilter}` : '/api/admin/orders';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleStatusChange = (id: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl tracking-wider text-[#f5f0e8]">ORDERS</h2>
        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs font-semibold text-[#f5f0e8] outline-none focus:border-[#e8531a]/50"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s]?.label ?? s}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs font-semibold text-[#888888] transition-colors hover:border-[#e8531a]/50 hover:text-[#e8531a]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Summary pills */}
      {orders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(
            orders.reduce<Record<string, number>>((acc, o) => {
              acc[o.status] = (acc[o.status] ?? 0) + 1;
              return acc;
            }, {})
          ).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                STATUS_META[status]?.color ?? 'text-[#888] bg-white/5'
              } ${statusFilter === status ? 'ring-1 ring-[#e8531a]' : ''}`}
            >
              {STATUS_META[status]?.label ?? status} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#e8531a]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={load} className="rounded-lg bg-[#e8531a] px-4 py-2 text-sm font-bold text-[#0d0d0d]">
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Package className="h-10 w-10 text-[#333]" />
          <p className="text-sm text-[#666]">
            {statusFilter ? `No ${STATUS_META[statusFilter]?.label ?? statusFilter} orders` : 'No orders yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
          <p className="pt-1 text-center text-xs text-[#444]">
            {orders.length} order{orders.length !== 1 ? 's' : ''} shown
          </p>
        </div>
      )}
    </div>
  );
}
