'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Users, BarChart2, RefreshCw, Loader2, Clock, MapPin,
  Star, ThumbsUp, Zap,
} from 'lucide-react';

interface KPI { totalRevenue: number; totalOrders: number; avgOrderValue: number; uniqueCustomers: number; taxCollected: number; feesCollected: number; }
interface Period { revenue: number; orders: number; }
interface DailyPoint { date: string; revenue: number; orders: number; }
interface ProductRow { name: string; category: string; unitsSold: number; revenue: number; }
interface CategoryRow { category: string; revenue: number; units: number; orderCount: number; }
interface CustomerRow { name: string; email: string; phone?: string; orderCount: number; totalSpent: number; lastOrder: string; avgFoodRating?: number; avgServiceRating?: number; }
interface StatusRow { status: string; count: number; }
interface DeliveryTiming { avgMinsToPrep?: number; avgMinsToCook?: number; avgMinsTotalTime?: number; deliveredCount: number; }
interface LocationRow { location: string; orderCount: number; revenue: number; }
interface FeedbackSummary { total: number; avgFoodRating: number; avgServiceRating: number; avgOverall: number; positiveFoodCount: number; positiveServiceCount: number; }
interface HourRow { hour: number; orders: number; }

interface AnalyticsData {
  kpi: KPI; today: Period; thisMonth: Period; lastMonth: Period;
  thisWeek: Period; lastWeek: Period;
  dailyRevenue: DailyPoint[]; topProducts: ProductRow[]; worstProducts: ProductRow[];
  categoryRevenue: CategoryRow[]; topCustomers: CustomerRow[]; statusBreakdown: StatusRow[];
  deliveryTiming: DeliveryTiming; topLocations: LocationRow[];
  feedbackSummary: FeedbackSummary; hourlyDistribution: HourRow[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n ?? 0);
const fmtMins = (m?: number) => m == null || isNaN(m) ? '—' : `${m} min`;

const ORANGE = '#e8531a';
const COLORS = ['#e8531a', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

function KpiCard({ label, value, sub, icon: Icon, trend }: { label: string; value: string; sub?: string; icon: any; trend?: 'up' | 'down' | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
      <div className="flex items-start justify-between">
        <div className="rounded-lg bg-[#e8531a]/10 p-2">
          <Icon className="h-5 w-5 text-[#e8531a]" />
        </div>
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-400" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-400" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-[#f5f0e8]">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#888]">{label}</p>
      {sub && <p className="mt-1 text-xs text-[#555]">{sub}</p>}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#888]">{title}</h3>;
}

function StarDisplay({ value }: { value?: number }) {
  if (!value) return <span className="text-[#555]">—</span>;
  return (
    <span className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-[#e8531a] text-[#e8531a]" />
      <span className="font-data font-bold text-[#f5f0e8]">{value.toFixed(1)}</span>
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 font-semibold text-[#f5f0e8]">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.name === 'revenue' ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Failed to load analytics');
      setData(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#e8531a]" /></div>;
  if (error) return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm text-red-400">{error}</p>
      <button onClick={load} className="rounded-lg bg-[#e8531a] px-4 py-2 text-sm font-bold text-[#0d0d0d]">Retry</button>
    </div>
  );
  if (!data) return null;

  const { kpi, today, thisMonth, lastMonth, thisWeek, lastWeek, dailyRevenue, topProducts, worstProducts, categoryRevenue, topCustomers, statusBreakdown, deliveryTiming, topLocations, feedbackSummary, hourlyDistribution } = data;

  const monthGrowth = lastMonth.revenue > 0 ? ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100 : null;
  const weekGrowth = lastWeek.revenue > 0 ? ((thisWeek.revenue - lastWeek.revenue) / lastWeek.revenue) * 100 : null;

  const filledDaily = (() => {
    const map = new Map(dailyRevenue.map((d) => [d.date, d]));
    const result: DailyPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push(map.get(key) ?? { date: key, revenue: 0, orders: 0 });
    }
    return result;
  })();

  const chartData = filledDaily.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const pieData = categoryRevenue.map((c, i) => ({ name: c.category, value: c.revenue, color: COLORS[i % COLORS.length] }));

  const hourLabels = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p'];
  const hourData = Array.from({ length: 24 }, (_, h) => ({
    hour: hourLabels[h],
    orders: hourlyDistribution.find((r) => r.hour === h)?.orders ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider text-[#f5f0e8]">REPORTS</h2>
        <button onClick={load} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs font-semibold text-[#888] transition-colors hover:border-[#e8531a]/50 hover:text-[#e8531a]">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <KpiCard label="Total Revenue" value={fmt(kpi.totalRevenue)} icon={DollarSign} />
        <KpiCard label="This Month" value={fmt(thisMonth.revenue)}
          sub={monthGrowth != null ? `${monthGrowth > 0 ? '+' : ''}${monthGrowth.toFixed(1)}% vs last month` : undefined}
          icon={TrendingUp} trend={monthGrowth != null ? (monthGrowth >= 0 ? 'up' : 'down') : null} />
        <KpiCard label="This Week" value={fmt(thisWeek.revenue)}
          sub={weekGrowth != null ? `${weekGrowth > 0 ? '+' : ''}${weekGrowth.toFixed(1)}% vs last week` : undefined}
          icon={Zap} trend={weekGrowth != null ? (weekGrowth >= 0 ? 'up' : 'down') : null} />
        <KpiCard label="Today" value={fmt(today.revenue)} sub={`${today.orders} orders`} icon={DollarSign} />
        <KpiCard label="Total Orders" value={kpi.totalOrders.toString()} icon={ShoppingBag} />
        <KpiCard label="Avg Order Value" value={fmt(kpi.avgOrderValue)} icon={BarChart2} />
        <KpiCard label="Unique Customers" value={kpi.uniqueCustomers.toString()} icon={Users} />
        <KpiCard label="Tax Collected" value={fmt(kpi.taxCollected)} sub="8% rate" icon={DollarSign} />
      </div>

      {/* ── Delivery Performance ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {[
          { label: 'Avg. Time to Kitchen', value: fmtMins(deliveryTiming.avgMinsToPrep), icon: Clock, sub: 'Order placed → Preparing' },
          { label: 'Avg. Cook Time', value: fmtMins(deliveryTiming.avgMinsToCook), icon: Zap, sub: 'Preparing → Ready' },
          { label: 'Avg. Total Turnaround', value: fmtMins(deliveryTiming.avgMinsTotalTime), icon: Zap, sub: `Based on ${deliveryTiming.deliveredCount ?? 0} completed orders` },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
            <div className="mb-2 flex items-center gap-2">
              <m.icon className="h-4 w-4 text-[#e8531a]" />
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">{m.label}</p>
            </div>
            <p className="font-display text-3xl text-[#f5f0e8]">{m.value}</p>
            <p className="mt-1 text-xs text-[#555]">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Customer Feedback ── */}
      {feedbackSummary.total > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
          <SectionHeader title="Customer Feedback" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="font-display text-4xl text-[#e8531a]">{feedbackSummary.avgOverall?.toFixed(1) ?? '—'}</p>
              <p className="mt-1 text-xs text-[#555]">Overall rating</p>
              <div className="mt-1 flex justify-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(feedbackSummary.avgOverall ?? 0) ? 'fill-[#e8531a] text-[#e8531a]' : 'text-[#333]'}`} />
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="font-display text-4xl text-[#f5f0e8]">{feedbackSummary.avgFoodRating?.toFixed(1) ?? '—'}</p>
              <p className="mt-1 text-xs text-[#555]">Food quality</p>
            </div>
            <div className="text-center">
              <p className="font-display text-4xl text-[#f5f0e8]">{feedbackSummary.avgServiceRating?.toFixed(1) ?? '—'}</p>
              <p className="mt-1 text-xs text-[#555]">Service</p>
            </div>
            <div className="text-center">
              <p className="font-display text-4xl text-green-400">{feedbackSummary.total}</p>
              <p className="mt-1 text-xs text-[#555]">Total reviews</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-green-400">
                <ThumbsUp className="h-3 w-3" />
                {feedbackSummary.positiveFoodCount} positive
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Revenue Trend ── */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <SectionHeader title="Revenue — Last 30 Days" />
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ORANGE} stopOpacity={0.25} />
                <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} interval={6} />
            <YAxis tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} width={48} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke={ORANGE} strokeWidth={2} fill="url(#revGrad)" dot={false} activeDot={{ r: 4, fill: ORANGE }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Peak Hours ── */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <SectionHeader title="Orders by Hour of Day" />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={hourData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
            <XAxis dataKey="hour" tick={{ fill: '#666', fontSize: 9 }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="orders" fill={ORANGE} opacity={0.8} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Top Products + Category ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
          <SectionHeader title="Top Items by Revenue" />
          {topProducts.length === 0 ? <p className="py-8 text-center text-sm text-[#444]">No sales data yet</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts.slice(0, 7)} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#aaa', fontSize: 10 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill={ORANGE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
          <SectionHeader title="Revenue by Category" />
          {pieData.length === 0 ? <p className="py-8 text-center text-sm text-[#444]">No sales data yet</p> : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: '#1a1a1a', border: '1px solid #ffffff18', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-[#aaa]">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Delivery Locations ── */}
      {topLocations.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#e8531a]" />
            <SectionHeader title="Top Delivery Locations" />
          </div>
          <div className="space-y-2">
            {topLocations.slice(0, 10).map((loc, i) => {
              const maxOrders = topLocations[0].orderCount;
              const pct = maxOrders > 0 ? (loc.orderCount / maxOrders) * 100 : 0;
              return (
                <div key={i} className="rounded-lg border border-white/5 bg-[#0d0d0d] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[#f5f0e8]">{loc.location}</p>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/5">
                        <div className="h-1.5 rounded-full bg-[#e8531a]" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-data text-sm font-bold text-[#e8531a]">{loc.orderCount} orders</p>
                      <p className="text-xs text-[#555]">{fmt(loc.revenue)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Order Status Breakdown ── */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <SectionHeader title="Order Status Breakdown" />
        <div className="flex flex-wrap gap-3">
          {statusBreakdown.map((s) => (
            <div key={s.status} className="rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3 text-center">
              <p className="text-lg font-bold text-[#f5f0e8]">{s.count}</p>
              <p className="text-xs capitalize text-[#888]">{s.status}</p>
            </div>
          ))}
          {statusBreakdown.length === 0 && <p className="text-sm text-[#444]">No orders yet</p>}
        </div>
      </div>

      {/* ── Top Customers ── */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <SectionHeader title="Top Customers by Lifetime Value" />
        {topCustomers.length === 0 ? <p className="py-4 text-center text-sm text-[#444]">No orders yet</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['#', 'Customer', 'Orders', 'Spent', 'Food ★', 'Service ★', 'Last Order'].map((h) => (
                    <th key={h} className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-[#888]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topCustomers.slice(0, 10).map((c, i) => (
                  <tr key={c.email} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pr-3 text-[#555]">{i + 1}</td>
                    <td className="py-2.5">
                      <p className="font-medium text-[#f5f0e8]">{c.name || '—'}</p>
                      <p className="text-xs text-[#555]">{c.email}</p>
                    </td>
                    <td className="py-2.5 font-data text-[#f5f0e8]">{c.orderCount}</td>
                    <td className="py-2.5 font-data font-semibold text-[#e8531a]">{fmt(c.totalSpent)}</td>
                    <td className="py-2.5"><StarDisplay value={c.avgFoodRating} /></td>
                    <td className="py-2.5"><StarDisplay value={c.avgServiceRating} /></td>
                    <td className="py-2.5 text-xs text-[#555]">{new Date(c.lastOrder).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Least Popular Items ── */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <SectionHeader title="Least Popular Items" />
        <p className="mb-4 text-xs text-[#555]">Available items with fewest sales — consider promoting or updating these.</p>
        {worstProducts.length === 0 ? <p className="py-4 text-center text-sm text-[#444]">No data yet</p> : (
          <div className="space-y-2">
            {worstProducts.map((p) => (
              <div key={p.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0d0d0d] px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-[#f5f0e8]">{p.name}</p>
                  <p className="text-xs text-[#555]">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-data text-sm text-[#e8531a]">{p.unitsSold} sold</p>
                  <p className="font-data text-xs text-[#555]">{fmt(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
