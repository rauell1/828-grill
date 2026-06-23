'use client';

import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag,
  Users, BarChart2, RefreshCw, Loader2,
} from 'lucide-react';

interface KPI {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  taxCollected: number;
  feesCollected: number;
}
interface Period { revenue: number; orders: number; }
interface DailyPoint { date: string; revenue: number; orders: number; }
interface ProductRow { name: string; category: string; unitsSold: number; revenue: number; }
interface CategoryRow { category: string; revenue: number; units: number; orderCount: number; }
interface CustomerRow { name: string; email: string; orderCount: number; totalSpent: number; lastOrder: string; }
interface StatusRow { status: string; count: number; }

interface AnalyticsData {
  kpi: KPI;
  today: Period;
  thisMonth: Period;
  lastMonth: Period;
  dailyRevenue: DailyPoint[];
  topProducts: ProductRow[];
  worstProducts: ProductRow[];
  categoryRevenue: CategoryRow[];
  topCustomers: CustomerRow[];
  statusBreakdown: StatusRow[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n ?? 0);

const ORANGE = '#e8531a';
const COLORS = ['#e8531a', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

function StatCard({
  label, value, sub, icon: Icon, trend,
}: {
  label: string; value: string; sub?: string; icon: any; trend?: 'up' | 'down' | null;
}) {
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
      <p className="text-xs font-semibold uppercase tracking-wider text-[#888888]">{label}</p>
      {sub && <p className="mt-1 text-xs text-[#666666]">{sub}</p>}
    </div>
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
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Failed to load analytics');
      setData(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#e8531a]" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-red-400">{error}</p>
        <button onClick={load} className="rounded-lg bg-[#e8531a] px-4 py-2 text-sm font-bold text-[#0d0d0d]">
          Retry
        </button>
      </div>
    );
  }
  if (!data) return null;

  const { kpi, today, thisMonth, lastMonth, dailyRevenue, topProducts, worstProducts, categoryRevenue, topCustomers, statusBreakdown } = data;

  const revenueGrowth = lastMonth.revenue > 0
    ? ((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100
    : null;

  // Fill gaps in daily revenue for last 30 days
  const filledDaily = (() => {
    const map = new Map(dailyRevenue.map((d) => [d.date, d]));
    const result: DailyPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push(map.get(key) ?? { date: key, revenue: 0, orders: 0 });
    }
    return result;
  })();

  const chartData = filledDaily.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const pieData = categoryRevenue.map((c, i) => ({
    name: c.category,
    value: c.revenue,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-wider text-[#f5f0e8]">
          ANALYTICS
        </h2>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs font-semibold text-[#888888] transition-colors hover:border-[#e8531a]/50 hover:text-[#e8531a]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={fmt(kpi.totalRevenue)} icon={DollarSign} />
        <StatCard
          label="This Month"
          value={fmt(thisMonth.revenue)}
          sub={revenueGrowth !== null
            ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs last month`
            : undefined}
          icon={TrendingUp}
          trend={revenueGrowth !== null ? (revenueGrowth >= 0 ? 'up' : 'down') : null}
        />
        <StatCard label="Today" value={fmt(today.revenue)} sub={`${today.orders} orders`} icon={DollarSign} />
        <StatCard label="Total Orders" value={kpi.totalOrders.toString()} icon={ShoppingBag} />
        <StatCard label="Avg Order Value" value={fmt(kpi.avgOrderValue)} icon={BarChart2} />
        <StatCard label="Unique Customers" value={kpi.uniqueCustomers.toString()} icon={Users} />
        <StatCard label="Tax Collected" value={fmt(kpi.taxCollected)} sub="8% rate" icon={DollarSign} />
        <StatCard label="Service Fees" value={fmt(kpi.feesCollected)} sub="$1.50/order" icon={DollarSign} />
      </div>

      {/* Revenue trend */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#888888]">
          Revenue — Last 30 Days
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ORANGE} stopOpacity={0.25} />
                <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#666', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={ORANGE}
              strokeWidth={2}
              fill="url(#revGrad)"
              dot={false}
              activeDot={{ r: 4, fill: ORANGE }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top products + Category split */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Top products bar chart */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#888888]">
            Top Items by Revenue
          </h3>
          {topProducts.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#444]">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={topProducts.slice(0, 7)}
                layout="vertical"
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: '#666', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#aaa', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" fill={ORANGE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category donut */}
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#888888]">
            Revenue by Category
          </h3>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#444]">No sales data yet</p>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => fmt(v)}
                    contentStyle={{
                      background: '#1a1a1a',
                      border: '1px solid #ffffff18',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-xs text-[#aaa]">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order status breakdown */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#888888]">
          Order Status Breakdown
        </h3>
        <div className="flex flex-wrap gap-3">
          {statusBreakdown.map((s) => (
            <div key={s.status} className="rounded-lg border border-white/10 bg-[#0d0d0d] px-4 py-3 text-center">
              <p className="text-lg font-bold text-[#f5f0e8]">{s.count}</p>
              <p className="text-xs capitalize text-[#888888]">{s.status}</p>
            </div>
          ))}
          {statusBreakdown.length === 0 && (
            <p className="text-sm text-[#444]">No orders yet</p>
          )}
        </div>
      </div>

      {/* Top customers */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#888888]">
          Top Customers
        </h3>
        {topCustomers.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#444]">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">#</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-[#888888]">Customer</th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-[#888888]">Orders</th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-[#888888]">Total Spent</th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wider text-[#888888]">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c, i) => (
                  <tr key={c.email} className="border-b border-white/5 last:border-0">
                    <td className="py-2.5 pr-3 text-[#888888]">{i + 1}</td>
                    <td className="py-2.5">
                      <p className="font-medium text-[#f5f0e8]">{c.name || '—'}</p>
                      <p className="text-xs text-[#666666]">{c.email}</p>
                    </td>
                    <td className="py-2.5 text-right font-data text-[#f5f0e8]">{c.orderCount}</td>
                    <td className="py-2.5 text-right font-data font-semibold text-[#e8531a]">
                      {fmt(c.totalSpent)}
                    </td>
                    <td className="py-2.5 text-right text-xs text-[#666666]">
                      {new Date(c.lastOrder).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Least popular items */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
        <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-[#888888]">
          Least Popular Items
        </h3>
        <p className="mb-4 text-xs text-[#555]">Available items with fewest sales — consider promoting or updating these.</p>
        {worstProducts.length === 0 ? (
          <p className="py-4 text-center text-sm text-[#444]">No data yet</p>
        ) : (
          <div className="space-y-2">
            {worstProducts.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0d0d0d] px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-[#f5f0e8]">{p.name}</p>
                  <p className="text-xs text-[#666]">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-data text-sm text-[#e8531a]">{p.unitsSold} sold</p>
                  <p className="font-data text-xs text-[#666]">{fmt(p.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
