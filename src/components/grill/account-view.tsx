'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth/client';
import { useUI } from '@/store/ui';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, shortId } from '@/lib/format';
import { User, Package, LogOut, Save, Loader2, Mail, Phone, MapPin, Receipt, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface OrderRow {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  items: { id: string; quantity: number; menuItem: { name: string } }[];
}

export function AccountView() {
  const { data: sessionData, isPending } = authClient.useSession();
  const session = sessionData;
  const status = isPending ? 'loading' : session ? 'authenticated' : 'unauthenticated';
  const { setView, setOrderId } = useUI();
  const { toast: legacyToast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    if (status === 'unauthenticated') {
      setView('login');
      return;
    }
    if (status !== 'authenticated') return;

    let cancelled = false;
    (async () => {
      try {
        const [pRes, oRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/orders'),
        ]);
        const pData = await pRes.json();
        const oData = await oRes.json();
        if (cancelled) return;
        if (pRes.ok && pData.user) {
          setProfile(pData.user);
          setEditForm({
            name: pData.user.name || '',
            phone: pData.user.phone || '',
            address: pData.user.address || '',
          });
        }
        if (oRes.ok) setOrders(oData.orders || []);
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, setView]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.user);
      toast.success('Profile updated');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    legacyToast({ title: 'Signed out', description: 'See you soon!' });
    setView('home');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#e8531a]" />
      </div>
    );
  }

  if (!session?.user) return null;
  const user = session.user;

  return (
    <div className="min-h-screen px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => setView('home')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[#888888] transition-colors hover:text-[#e8531a]"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </button>

        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8531a]/15 ring-2 ring-[#e8531a]/30">
              <User className="h-8 w-8 text-[#e8531a]" />
            </div>
            <div>
              <h1 className="font-display text-4xl tracking-wide text-[#f5f0e8]">
                {profile?.name || user.name}
              </h1>
              <p className="text-sm text-[#888888]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-[#f5f0e8] transition-colors hover:border-red-500/50 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Profile card */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#f5f0e8]">
              <User className="h-4 w-4 text-[#e8531a]" /> Profile Details
            </h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888888]">
                  <User className="h-3 w-3" /> Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888888]">
                  <Mail className="h-3 w-3" /> Email
                </label>
                <input
                  value={user.email || ''}
                  readOnly
                  className="w-full rounded-lg border border-white/10 bg-[#0d0d0d]/50 px-3 py-2.5 text-sm text-[#888888] outline-none"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888888]">
                  <Phone className="h-3 w-3" /> Phone
                </label>
                <input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a] placeholder:text-[#555]"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#888888]">
                  <MapPin className="h-3 w-3" /> Delivery Address
                </label>
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="123 Main St, Springfield, IL"
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a] placeholder:text-[#555]"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-3 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff6b2c] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Order history */}
          <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
            <h2 className="mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#f5f0e8]">
              <Package className="h-4 w-4 text-[#e8531a]" /> Order History
            </h2>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <Receipt className="h-10 w-10 text-[#888888]/50" />
                <p className="text-sm text-[#888888]">No orders yet.</p>
                <button
                  onClick={() => setView('menu')}
                  className="rounded-lg bg-[#e8531a] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0d0d0d] transition-colors hover:bg-[#ff6b2c]"
                >
                  Start an order
                </button>
              </div>
            ) : (
              <div className="scroll-area-dark max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setOrderId(o.id);
                      setView('order');
                    }}
                    className="block w-full rounded-xl border border-white/10 bg-[#0d0d0d] p-4 text-left transition-colors hover:border-[#e8531a]/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-data text-sm font-bold text-[#e8531a]">
                        #{shortId(o.id)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          o.status === 'paid'
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-yellow-500/15 text-yellow-400'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[#888888]">
                      {o.items.map((i) => `${i.quantity}× ${i.menuItem.name}`).join(', ')}
                    </p>
                    <div className="mt-2 flex justify-between text-sm">
                      <span className="text-[#888888]">
                        {new Date(o.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="font-data font-bold text-[#f5f0e8]">
                        {formatPrice(o.total)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
