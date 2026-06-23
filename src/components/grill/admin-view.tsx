'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, Pencil, Trash2, X, Check, Loader2, ChevronDown,
  LayoutGrid, Search, AlertTriangle, ToggleLeft, ToggleRight,
  Star, ImageIcon, ArrowLeft, Upload, Link2, Mail, Users, Send,
  Clock, ShoppingBag, BarChart2, MessageSquare, Phone, MapPin,
  Tag, ToggleLeft as ToggleOff, Trash2 as TrashIcon, PauseCircle, PlayCircle, Eye, EyeOff,
} from 'lucide-react';
import { useUI } from '@/store/ui';
import { cn } from '@/lib/utils';
import { AdminOrders } from './admin-orders';
import { AdminAnalytics } from './admin-analytics';
import { AdminLiveOrders } from './admin-live-orders';

type Tab = 'live' | 'menu' | 'orders' | 'promos' | 'customers' | 'feedback' | 'newsletter' | 'analytics';
type Category = 'Burgers' | 'Sides' | 'Drinks' | 'Combos';
type ImageMode = 'url' | 'upload';

const CATEGORIES: Category[] = ['Burgers', 'Sides', 'Drinks', 'Combos'];

const CATEGORY_COLORS: Record<Category, string> = {
  Burgers: 'bg-orange-500/15 text-orange-400',
  Sides:   'bg-yellow-500/15 text-yellow-400',
  Drinks:  'bg-blue-500/15 text-blue-400',
  Combos:  'bg-purple-500/15 text-purple-400',
};

interface AdminItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  available: boolean;
  featured: boolean;
  allergens?: string;
}

interface Subscriber { id: string; name: string; email: string; }
interface Campaign { id: string; subject: string; sentAt: string; recipientCount: number; }

const EMPTY_FORM: Omit<AdminItem, 'id'> = {
  name: '', description: '', price: 0, category: 'Burgers',
  imageUrl: '', available: true, featured: false, allergens: '',
};

export function AdminView() {
  const setView = useUI((s) => s.setView);

  // ── Tabs ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>('live');

  // ── Menu state ────────────────────────────────────────────────────────
  const [items, setItems] = useState<AdminItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Category | 'All'>('All');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AdminItem, 'id'>>(EMPTY_FORM);
  const [imgPreviewError, setImgPreviewError] = useState(false);
  const [imageMode, setImageMode] = useState<ImageMode>('url');
  const [uploading, setUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Customers state ───────────────────────────────────────────────────
  const [custLoading, setCustLoading] = useState(false);
  const [custLoaded, setCustLoaded] = useState(false);
  interface CustomerRow { id: string; name: string; email: string; phone?: string; address?: string; joinedAt: string; emailVerified: boolean; orderCount: number; totalSpent: number; lastOrderAt?: string; avgFoodRating?: number; avgServiceRating?: number; feedbackCount: number; }
  interface CustSummary { totalCustomers: number; newThisMonth: number; newThisWeek: number; }
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [custSummary, setCustSummary] = useState<CustSummary | null>(null);
  const [custSearch, setCustSearch] = useState('');

  const loadCustomers = async () => {
    if (custLoaded) return;
    setCustLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      const data = await res.json();
      if (res.ok) { setCustomers(data.customers ?? []); setCustSummary(data.summary); setCustLoaded(true); }
      else showToast(data.error ?? 'Failed to load customers', 'err');
    } catch { showToast('Network error', 'err'); }
    finally { setCustLoading(false); }
  };

  // ── Feedback state ─────────────────────────────────────────────────────
  const [fbLoading, setFbLoading] = useState(false);
  const [fbLoaded, setFbLoaded] = useState(false);
  interface FeedbackRow { id: string; orderId: string; foodRating: number; serviceRating: number; comment?: string; createdAt: string; customerName: string; customerEmail: string; orderTotal: number; }
  interface FbSummary { total: number; avgFoodRating: number; avgServiceRating: number; avgOverall: number; fiveStarFood: number; fiveStarService: number; }
  const [feedbackList, setFeedbackList] = useState<FeedbackRow[]>([]);
  const [fbSummary, setFbSummary] = useState<FbSummary | null>(null);

  const loadFeedback = async () => {
    if (fbLoaded) return;
    setFbLoading(true);
    try {
      const res = await fetch('/api/admin/feedback');
      const data = await res.json();
      if (res.ok) { setFeedbackList(data.list ?? []); setFbSummary(data.summary); setFbLoaded(true); }
      else showToast(data.error ?? 'Failed to load feedback', 'err');
    } catch { showToast('Network error', 'err'); }
    finally { setFbLoading(false); }
  };

  // ── Promos state ───────────────────────────────────────────────────────
  interface PromoRow { id: string; code: string; discountType: 'pct' | 'flat'; discountValue: number; status: 'active' | 'paused' | 'disabled'; usedCount: number; maxUses: number | null; expiresAt: string | null; createdAt: string; }
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promosLoaded, setPromosLoaded] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: '', discountType: 'pct', discountValue: '', maxUses: '', expiresAt: '' });
  const [promoCreating, setPromoCreating] = useState(false);
  const [promoDeleteConfirm, setPromoDeleteConfirm] = useState<string | null>(null);

  const loadPromos = async () => {
    if (promosLoaded) return;
    setPromosLoading(true);
    try {
      const res = await fetch('/api/admin/promo');
      const data = await res.json();
      if (res.ok) { setPromos(data.promos ?? []); setPromosLoaded(true); }
      else showToast(data.error ?? 'Failed to load promos', 'err');
    } catch { showToast('Network error', 'err'); }
    finally { setPromosLoading(false); }
  };

  const handlePromoCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoCreating(true);
    try {
      const res = await fetch('/api/admin/promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoForm.code,
          discountType: promoForm.discountType,
          discountValue: promoForm.discountValue,
          maxUses: promoForm.maxUses || null,
          expiresAt: promoForm.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? 'Failed to create promo', 'err'); return; }
      setPromos((p) => [data.promo, ...p]);
      setPromoForm({ code: '', discountType: 'pct', discountValue: '', maxUses: '', expiresAt: '' });
      showToast(`Promo ${data.promo.code} created`);
    } catch { showToast('Network error', 'err'); }
    finally { setPromoCreating(false); }
  };

  const handlePromoStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/promo/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const { promo } = await res.json();
      setPromos((p) => p.map((x) => (x.id === id ? promo : x)));
      showToast(`Promo ${status}`);
    }
  };

  const handlePromoDelete = async (id: string) => {
    const res = await fetch(`/api/admin/promo/${id}`, { method: 'DELETE' });
    if (res.ok) { setPromos((p) => p.filter((x) => x.id !== id)); showToast('Promo deleted'); }
    setPromoDeleteConfirm(null);
  };

  // ── Newsletter state ───────────────────────────────────────────────────
  const [nlLoading, setNlLoading] = useState(false);
  const [nlLoaded, setNlLoaded] = useState(false);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [configuredFrom, setConfiguredFrom] = useState<string | null>(null);
  const [nlForm, setNlForm] = useState({ subject: '', body: '' });
  const [sending, setSending] = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3400);
  };

  // ── Load menu ─────────────────────────────────────────────────────────
  const loadMenu = async () => {
    setMenuLoading(true);
    try {
      const res = await fetch('/api/admin/menu');
      const data = await res.json();
      if (res.ok) setItems(data.items ?? []);
      else showToast(data.error ?? 'Failed to load items', 'err');
    } catch { showToast('Network error', 'err'); }
    finally { setMenuLoading(false); }
  };

  useEffect(() => { loadMenu(); }, []);

  // ── Load newsletter (lazy) ─────────────────────────────────────────────
  const loadNewsletter = async () => {
    if (nlLoaded) return;
    setNlLoading(true);
    try {
      const res = await fetch('/api/admin/newsletter');
      const data = await res.json();
      if (res.ok) {
        setSubscribers(data.subscribers ?? []);
        setCampaigns(data.campaigns ?? []);
        setConfiguredFrom(data.configuredFrom ?? null);
        setNlLoaded(true);
      } else {
        showToast(data.error ?? 'Failed to load newsletter data', 'err');
      }
    } catch { showToast('Network error', 'err'); }
    finally { setNlLoading(false); }
  };

  useEffect(() => {
    if (tab === 'newsletter') loadNewsletter();
    if (tab === 'customers') loadCustomers();
    if (tab === 'feedback') loadFeedback();
    if (tab === 'promos') loadPromos();
  }, [tab]);

  // ── Panel helpers ──────────────────────────────────────────────────────
  const openCreate = () => {
    setEditId(null); setForm(EMPTY_FORM);
    setImgPreviewError(false); setImageMode('url');
    setPanelOpen(true);
  };
  const openEdit = (item: AdminItem) => {
    setEditId(item.id);
    setForm({ name: item.name, description: item.description, price: item.price,
      category: item.category, imageUrl: item.imageUrl,
      available: item.available, featured: item.featured, allergens: item.allergens ?? '' });
    setImgPreviewError(false); setImageMode('url');
    setPanelOpen(true);
  };
  const closePanel = () => { setPanelOpen(false); setEditId(null); };

  // ── Image upload → Cloudinary (client-side, free tier) ───────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset   = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !preset) {
      showToast('Cloudinary not configured — add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to Vercel env vars', 'err');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File must be under 10 MB', 'err');
      return;
    }

    setUploading(true);
    setImgPreviewError(false);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', preset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? 'Upload failed');
      setForm((f) => ({ ...f, imageUrl: data.secure_url }));
      showToast('Image uploaded');
    } catch (err: any) {
      showToast(err.message ?? 'Upload failed', 'err');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Save menu item ─────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Name is required', 'err'); return; }
    if (form.price <= 0) { showToast('Price must be greater than 0', 'err'); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/admin/menu/${editId}` : '/api/admin/menu';
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, popular: form.featured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      if (editId) {
        setItems((prev) => prev.map((i) => i.id === editId ? data.item : i));
        showToast('Item updated');
      } else {
        setItems((prev) => [...prev, data.item]);
        showToast('Item created');
      }
      closePanel();
    } catch (err: any) {
      showToast(err.message ?? 'Save failed', 'err');
    } finally { setSaving(false); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Delete failed');
      if (data.softDeleted) {
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, available: false } : i));
        showToast('Item has orders — marked unavailable');
      } else {
        setItems((prev) => prev.filter((i) => i.id !== id));
        showToast('Item deleted');
      }
    } catch (err: any) {
      showToast(err.message ?? 'Delete failed', 'err');
    } finally { setDeleteConfirm(null); }
  };

  // ── Toggle available / featured ────────────────────────────────────────
  const toggleField = async (item: AdminItem, field: 'available' | 'featured') => {
    const newVal = !item[field];
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, [field]: newVal } : i));
    try {
      const body = field === 'available' ? { available: newVal } : { popular: newVal };
      const res = await fetch(`/api/admin/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Update failed');
    } catch {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, [field]: item[field] } : i));
      showToast('Update failed', 'err');
    }
  };

  // ── Send newsletter ───────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlForm.subject.trim() || !nlForm.body.trim()) {
      showToast('Subject and body are required', 'err'); return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nlForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Send failed');
      showToast(`Sent to ${data.sent} subscriber${data.sent === 1 ? '' : 's'} 🎉`);
      setNlForm({ subject: '', body: '' });
      // Refresh campaign history
      const fresh = await fetch('/api/admin/newsletter');
      const fd = await fresh.json();
      if (fresh.ok) setCampaigns(fd.campaigns ?? []);
    } catch (err: any) {
      showToast(err.message ?? 'Send failed', 'err');
    } finally { setSending(false); }
  };

  // ── Filtered menu ──────────────────────────────────────────────────────
  const filtered = items.filter((i) => {
    const matchCat = catFilter === 'All' || i.category === catFilter;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const stats = {
    total: items.length,
    active: items.filter((i) => i.available).length,
    byCategory: CATEGORIES.reduce((acc, c) => {
      acc[c] = items.filter((i) => i.category === c).length;
      return acc;
    }, {} as Record<Category, number>),
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="828 Grill Logo" className="h-8 w-8 object-contain" />
            <span className="font-display text-xl tracking-wider text-[#f5f0e8]">
              828 <span className="text-[#e8531a]">ADMIN</span>
            </span>
            <span className="ml-1 rounded-full border border-[#e8531a]/30 bg-[#e8531a]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#e8531a]">
              CMS
            </span>
          </div>
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-1.5 text-xs font-medium text-[#888] transition-colors hover:text-[#f5f0e8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to site
          </button>
        </div>

        {/* Tab nav */}
        <div className="mx-auto flex max-w-screen-xl gap-1 px-5 pb-0">
          {([
            { key: 'live', icon: Clock, label: 'Live' },
            { key: 'menu', icon: LayoutGrid, label: 'Menu' },
            { key: 'orders', icon: ShoppingBag, label: 'Orders' },
            { key: 'promos', icon: Tag, label: 'Promos' },
            { key: 'customers', icon: Users, label: 'Customers' },
            { key: 'feedback', icon: MessageSquare, label: 'Reviews' },
            { key: 'newsletter', icon: Mail, label: 'Newsletter' },
            { key: 'analytics', icon: BarChart2, label: 'Reports' },
          ] as const).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors',
                tab === key
                  ? 'border-[#e8531a] text-[#e8531a]'
                  : 'border-transparent text-[#555] hover:text-[#888]'
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto w-full max-w-screen-xl flex-1 px-5 py-8">

        {/* ══════════════ LIVE TAB ══════════════ */}
        {tab === 'live' && <AdminLiveOrders />}

        {/* ══════════════ MENU TAB ══════════════ */}
        {tab === 'menu' && (
          <>
            {/* Stats */}
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Total" value={stats.total} />
              <StatCard label="Active" value={stats.active} valueClass="text-green-400" />
              {CATEGORIES.map((cat) => (
                <StatCard key={cat} label={cat} value={stats.byCategory[cat]} />
              ))}
            </div>

            {/* Toolbar */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555]" />
                  <input
                    type="text"
                    placeholder="Search items…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 rounded-lg border border-white/10 bg-[#141414] pl-8 pr-3 text-sm text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                  />
                </div>
                <div className="relative">
                  <select
                    value={catFilter}
                    onChange={(e) => setCatFilter(e.target.value as Category | 'All')}
                    className="h-9 appearance-none rounded-lg border border-white/10 bg-[#141414] pl-3 pr-8 text-sm text-[#f5f0e8] outline-none focus:border-[#e8531a]/50"
                  >
                    <option value="All">All categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555]" />
                </div>
              </div>
              <button
                onClick={openCreate}
                className="flex h-9 items-center gap-2 rounded-lg bg-[#e8531a] px-4 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#ff6b2c]"
              >
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            {/* Table */}
            {menuLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#e8531a]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#141414] py-24 text-center">
                <LayoutGrid className="mb-3 h-10 w-10 text-[#333]" />
                <p className="text-[#555]">No items match your filter.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-[#141414]">
                      <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-[#555]">Item</th>
                      <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-[#555]">Category</th>
                      <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-[#555]">Price</th>
                      <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-[#555]">Live</th>
                      <th className="px-4 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-[#555]">Popular</th>
                      <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-[#555]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={cn(
                          'border-b border-white/5 transition-colors hover:bg-white/[0.02]',
                          idx % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#111]'
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
                              {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.name} fill sizes="48px" className="object-cover" unoptimized />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <ImageIcon className="h-4 w-4 text-[#333]" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#f5f0e8]">{item.name}</p>
                              <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-[#555]">{item.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider', CATEGORY_COLORS[item.category])}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[#e8531a]">
                          ${Number(item.price).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleField(item, 'available')} className="mx-auto flex items-center transition-opacity hover:opacity-80">
                            {item.available
                              ? <ToggleRight className="h-6 w-6 text-green-400" />
                              : <ToggleLeft className="h-6 w-6 text-[#444]" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleField(item, 'featured')} className="mx-auto flex items-center transition-opacity hover:opacity-80">
                            <Star className={cn('h-4 w-4 transition-colors', item.featured ? 'fill-[#e8531a] text-[#e8531a]' : 'text-[#333]')} />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEdit(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[#888] transition-colors hover:border-[#e8531a]/40 hover:text-[#e8531a]"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            {deleteConfirm === item.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="flex h-8 items-center gap-1 rounded-lg bg-red-500/20 px-2.5 text-xs font-bold text-red-400 hover:bg-red-500/30"
                                >
                                  <Check className="h-3.5 w-3.5" /> Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[#888] hover:text-[#f5f0e8]"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(item.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[#888] transition-colors hover:border-red-500/40 hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ══════════════ NEWSLETTER TAB ══════════════ */}
        {tab === 'newsletter' && (
          <div className="space-y-8">
            {nlLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-[#e8531a]" />
              </div>
            ) : (
              <>
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-[#141414] px-6 py-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#e8531a]" />
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">Subscribers</p>
                    </div>
                    <p className="font-display text-4xl text-[#e8531a]">{subscribers.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#141414] px-6 py-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Send className="h-4 w-4 text-[#888]" />
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">Campaigns sent</p>
                    </div>
                    <p className="font-display text-4xl text-[#f5f0e8]">{campaigns.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#141414] px-6 py-5">
                    <div className="mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#888]" />
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">Total delivered</p>
                    </div>
                    <p className="font-display text-4xl text-[#f5f0e8]">
                      {campaigns.reduce((s, c) => s + c.recipientCount, 0)}
                    </p>
                  </div>
                </div>

                {/* Sender address indicator */}
                <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
                  configuredFrom
                    ? 'border-green-500/20 bg-green-500/5 text-green-400'
                    : 'border-red-500/20 bg-red-500/5 text-red-400'
                }`}>
                  <Mail className="h-4 w-4 shrink-0" />
                  {configuredFrom ? (
                    <span>Sending from: <span className="font-mono">{configuredFrom}</span></span>
                  ) : (
                    <span>
                      <strong>NEWSLETTER_FROM not set</strong> — using fallback address.
                      Add <span className="font-mono">NEWSLETTER_FROM=you@yourdomain.com</span> to Vercel env vars.
                    </span>
                  )}
                </div>

                <div className="grid gap-8 lg:grid-cols-5">
                  {/* ── Compose form ── */}
                  <div className="lg:col-span-3">
                    <h2 className="mb-4 font-display text-xl tracking-wider text-[#f5f0e8]">
                      COMPOSE <span className="text-[#e8531a]">CAMPAIGN</span>
                    </h2>
                    <form onSubmit={handleSend} className="space-y-4 rounded-xl border border-white/10 bg-[#141414] p-6">
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#555]">
                          Subject <span className="text-[#e8531a]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. New Smoky BBQ Burger is here 🔥"
                          value={nlForm.subject}
                          onChange={(e) => setNlForm((f) => ({ ...f, subject: e.target.value }))}
                          className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#555]">
                          Message <span className="text-[#e8531a]">*</span>
                        </label>
                        <textarea
                          required
                          rows={8}
                          placeholder="Write your message here. Each line will become a paragraph in the email…"
                          value={nlForm.body}
                          onChange={(e) => setNlForm((f) => ({ ...f, body: e.target.value }))}
                          className="w-full resize-none rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm leading-6 text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                        />
                      </div>

                      {/* Recipient preview */}
                      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0d0d0d] px-4 py-3 text-sm">
                        <span className="text-[#555]">Will be sent to</span>
                        <span className="font-bold text-[#f5f0e8]">
                          {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={sending || subscribers.length === 0}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#ff6b2c] disabled:opacity-50"
                      >
                        {sending
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                          : <><Send className="h-4 w-4" /> Send Campaign</>}
                      </button>

                      {subscribers.length === 0 && (
                        <p className="text-center text-xs text-[#555]">
                          No subscribers yet. They'll be added when users register with the newsletter opt-in.
                        </p>
                      )}
                    </form>
                  </div>

                  {/* ── Campaign history ── */}
                  <div className="lg:col-span-2">
                    <h2 className="mb-4 font-display text-xl tracking-wider text-[#f5f0e8]">
                      PAST <span className="text-[#e8531a]">CAMPAIGNS</span>
                    </h2>
                    {campaigns.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#141414] py-16 text-center">
                        <Clock className="mb-3 h-8 w-8 text-[#333]" />
                        <p className="text-sm text-[#555]">No campaigns sent yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {campaigns.map((c) => (
                          <div key={c.id} className="rounded-xl border border-white/10 bg-[#141414] px-5 py-4">
                            <p className="truncate font-medium text-[#f5f0e8]">{c.subject}</p>
                            <div className="mt-2 flex items-center justify-between text-xs text-[#555]">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(c.sentAt).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                })}
                              </span>
                              <span className="flex items-center gap-1 text-green-400/80">
                                <Users className="h-3 w-3" /> {c.recipientCount} sent
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════ ORDERS TAB ══════════════ */}
        {tab === 'orders' && <AdminOrders />}

        {/* ══════════════ CUSTOMERS TAB ══════════════ */}
        {tab === 'customers' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl tracking-wider text-[#f5f0e8]">CUSTOMERS</h2>

            {/* Summary cards */}
            {custSummary && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total customers', value: custSummary.totalCustomers, color: 'text-[#f5f0e8]' },
                  { label: 'New this month', value: custSummary.newThisMonth, color: 'text-green-400' },
                  { label: 'New this week', value: custSummary.newThisWeek, color: 'text-blue-400' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-[#141414] px-5 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">{s.label}</p>
                    <p className={`mt-1 font-display text-3xl ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555]" />
              <input
                type="text"
                placeholder="Search customers…"
                value={custSearch}
                onChange={(e) => setCustSearch(e.target.value)}
                className="h-9 w-full rounded-lg border border-white/10 bg-[#141414] pl-8 pr-3 text-sm text-[#f5f0e8] outline-none placeholder:text-[#444] focus:border-[#e8531a]/50"
              />
            </div>

            {custLoading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#e8531a]" /></div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#141414]">
                        {['Customer', 'Contact', 'Orders', 'Lifetime Value', 'Food ★', 'Service ★', 'Joined'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-[#555]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {customers
                        .filter((c) => !custSearch || c.name?.toLowerCase().includes(custSearch.toLowerCase()) || c.email.toLowerCase().includes(custSearch.toLowerCase()))
                        .map((c, idx) => (
                          <tr key={c.id} className={cn('border-b border-white/5 transition-colors hover:bg-white/[0.02]', idx % 2 === 0 ? 'bg-[#0d0d0d]' : 'bg-[#111]')}>
                            <td className="px-4 py-3">
                              <p className="font-medium text-[#f5f0e8]">{c.name || '—'}</p>
                              <p className="text-xs text-[#555]">{c.email}</p>
                              {!c.emailVerified && <span className="mt-0.5 inline-block rounded-full bg-yellow-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yellow-400">Unverified</span>}
                            </td>
                            <td className="px-4 py-3">
                              {c.phone && <p className="flex items-center gap-1 text-xs text-[#888]"><Phone className="h-3 w-3" />{c.phone}</p>}
                              {c.address && <p className="mt-0.5 flex items-center gap-1 text-xs text-[#555]"><MapPin className="h-3 w-3" /><span className="max-w-[140px] truncate">{c.address}</span></p>}
                            </td>
                            <td className="px-4 py-3 font-data text-[#f5f0e8]">{c.orderCount}</td>
                            <td className="px-4 py-3 font-data font-semibold text-[#e8531a]">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.totalSpent)}
                            </td>
                            <td className="px-4 py-3">
                              {c.avgFoodRating ? (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-[#e8531a] text-[#e8531a]" />
                                  <span className="font-data text-[#f5f0e8]">{Number(c.avgFoodRating).toFixed(1)}</span>
                                </span>
                              ) : <span className="text-[#444]">—</span>}
                            </td>
                            <td className="px-4 py-3">
                              {c.avgServiceRating ? (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 fill-[#e8531a] text-[#e8531a]" />
                                  <span className="font-data text-[#f5f0e8]">{Number(c.avgServiceRating).toFixed(1)}</span>
                                </span>
                              ) : <span className="text-[#444]">—</span>}
                            </td>
                            <td className="px-4 py-3 text-xs text-[#555]">{new Date(c.joinedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <p className="border-t border-white/5 px-4 py-2 text-center text-xs text-[#444]">
                  {customers.length} customer{customers.length !== 1 ? 's' : ''} total
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ FEEDBACK TAB ══════════════ */}
        {tab === 'feedback' && (
          <div className="space-y-6">
            <h2 className="font-display text-2xl tracking-wider text-[#f5f0e8]">CUSTOMER <span className="text-[#e8531a]">REVIEWS</span></h2>

            {/* Summary */}
            {fbSummary && fbSummary.total > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { label: 'Total reviews', value: fbSummary.total, unit: '' },
                  { label: 'Avg overall', value: fbSummary.avgOverall?.toFixed(1) ?? '—', unit: '/ 5' },
                  { label: 'Food quality', value: fbSummary.avgFoodRating?.toFixed(1) ?? '—', unit: '/ 5' },
                  { label: 'Service', value: fbSummary.avgServiceRating?.toFixed(1) ?? '—', unit: '/ 5' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-[#141414] px-5 py-4 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">{s.label}</p>
                    <p className="mt-1 font-display text-3xl text-[#e8531a]">
                      {s.value}<span className="text-base text-[#555]"> {s.unit}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {fbLoading ? (
              <div className="flex h-40 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#e8531a]" /></div>
            ) : feedbackList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <MessageSquare className="h-10 w-10 text-[#333]" />
                <p className="text-sm text-[#555]">No reviews yet. Reviews appear after orders are delivered.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbackList.map((f) => (
                  <div key={f.id} className="rounded-xl border border-white/10 bg-[#141414] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#f5f0e8]">{f.customerName || '—'}</p>
                        <p className="text-xs text-[#555]">{f.customerEmail}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="font-data text-xs text-[#555]">
                          Order #{f.orderId.slice(-8).toUpperCase()} ·{' '}
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(f.orderTotal)}
                        </p>
                        <p className="text-xs text-[#444]">{new Date(f.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <div>
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-[#555]">Food</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`h-4 w-4 ${s <= f.foodRating ? 'fill-[#e8531a] text-[#e8531a]' : 'text-[#333]'}`} />
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] uppercase tracking-wider text-[#555]">Service</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={`h-4 w-4 ${s <= f.serviceRating ? 'fill-[#e8531a] text-[#e8531a]' : 'text-[#333]'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    {f.comment && (
                      <p className="mt-3 rounded-lg border border-white/5 bg-[#0d0d0d] px-3 py-2 text-sm italic text-[#aaa]">
                        &ldquo;{f.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ PROMOS TAB ══════════════ */}
        {tab === 'promos' && (
          <div className="space-y-8">
            <h2 className="font-display text-2xl tracking-wider text-[#f5f0e8]">
              PROMO <span className="text-[#e8531a]">CODES</span>
            </h2>

            {/* Create form */}
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#f5f0e8]">
                Create New Code
              </h3>
              <form onSubmit={handlePromoCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Code */}
                <div className="lg:col-span-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888]">Code</label>
                  <input
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="SUMMER20"
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 font-data text-sm uppercase tracking-wider text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888]">Type</label>
                  <select
                    value={promoForm.discountType}
                    onChange={(e) => setPromoForm({ ...promoForm, discountType: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none focus:border-[#e8531a]"
                  >
                    <option value="pct">Percentage (%)</option>
                    <option value="flat">Fixed amount ($)</option>
                  </select>
                </div>

                {/* Value */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888]">
                    {promoForm.discountType === 'pct' ? 'Discount %' : 'Discount $'}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    max={promoForm.discountType === 'pct' ? '100' : undefined}
                    step="0.01"
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })}
                    placeholder={promoForm.discountType === 'pct' ? '15' : '10.00'}
                    required
                    className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 font-data text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                  />
                </div>

                {/* Max uses */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888]">
                    Max Uses <span className="normal-case font-normal text-[#555]">(blank = unlimited)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={promoForm.maxUses}
                    onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 font-data text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                  />
                </div>

                {/* Expiry */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#888]">
                    Expires <span className="normal-case font-normal text-[#555]">(blank = never)</span>
                  </label>
                  <input
                    type="date"
                    value={promoForm.expiresAt}
                    onChange={(e) => setPromoForm({ ...promoForm, expiresAt: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]"
                  />
                </div>

                {/* Submit */}
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={promoCreating}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-2.5 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition hover:bg-[#ff6b2c] disabled:opacity-60"
                  >
                    {promoCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                    Create Code
                  </button>
                </div>
              </form>
            </div>

            {/* Promo list */}
            {promosLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-[#e8531a]" />
              </div>
            ) : promos.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] py-16 text-center">
                <Tag className="mx-auto mb-3 h-10 w-10 text-[#333]" />
                <p className="text-sm text-[#555]">No promo codes yet. Create one above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {promos.map((p) => {
                  const statusStyle = p.status === 'active'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : p.status === 'paused'
                    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20';

                  const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date();
                  const isMaxed = p.maxUses !== null && p.usedCount >= p.maxUses;

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'rounded-xl border bg-[#1a1a1a] p-4',
                        p.status === 'active' && !isExpired && !isMaxed ? 'border-white/10' : 'border-white/5 opacity-70'
                      )}
                    >
                      <div className="flex flex-wrap items-start gap-3">
                        {/* Code + badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-data text-lg font-bold tracking-widest text-[#f5f0e8]">
                              {p.code}
                            </span>
                            <span className={cn('rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusStyle)}>
                              {p.status}
                            </span>
                            {isExpired && (
                              <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                                Expired
                              </span>
                            )}
                            {isMaxed && (
                              <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-400">
                                Maxed out
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#888]">
                            <span>
                              {p.discountType === 'pct' ? `${p.discountValue}% off` : `$${p.discountValue.toFixed(2)} off`}
                            </span>
                            <span>
                              {p.usedCount} used{p.maxUses !== null ? ` / ${p.maxUses} max` : ''}
                            </span>
                            {p.expiresAt && (
                              <span>
                                Expires {new Date(p.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            )}
                            <span className="text-[#555]">
                              Created {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Status toggles */}
                          {p.status !== 'active' && (
                            <button
                              onClick={() => handlePromoStatus(p.id, 'active')}
                              className="flex items-center gap-1.5 rounded-lg border border-green-500/30 px-3 py-1.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/10"
                            >
                              <PlayCircle className="h-3.5 w-3.5" /> Activate
                            </button>
                          )}
                          {p.status === 'active' && (
                            <button
                              onClick={() => handlePromoStatus(p.id, 'paused')}
                              className="flex items-center gap-1.5 rounded-lg border border-yellow-500/30 px-3 py-1.5 text-xs font-semibold text-yellow-400 transition hover:bg-yellow-500/10"
                            >
                              <PauseCircle className="h-3.5 w-3.5" /> Pause
                            </button>
                          )}
                          {p.status !== 'disabled' && (
                            <button
                              onClick={() => handlePromoStatus(p.id, 'disabled')}
                              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                            >
                              <ToggleOff className="h-3.5 w-3.5" /> Disable
                            </button>
                          )}

                          {/* Delete */}
                          {promoDeleteConfirm === p.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handlePromoDelete(p.id)}
                                className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/30"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setPromoDeleteConfirm(null)}
                                className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#888] hover:text-[#f5f0e8]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setPromoDeleteConfirm(p.id)}
                              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-[#555] transition hover:border-red-500/30 hover:text-red-400"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ ANALYTICS TAB ══════════════ */}
        {tab === 'analytics' && <AdminAnalytics />}

      </div>

      {/* ── Edit / Create slide-over ── */}
      <>
        <div
          className={cn(
            'fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300',
            panelOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={closePanel}
        />
        <aside
          className={cn(
            'fixed right-0 top-0 z-[70] flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#0d0d0d] shadow-2xl transition-transform duration-300',
            panelOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <h2 className="font-display text-2xl tracking-wider text-[#f5f0e8]">
              {editId ? 'EDIT ITEM' : 'NEW ITEM'}
            </h2>
            <button
              onClick={closePanel}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-[#888] hover:border-white/20 hover:text-[#f5f0e8]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex flex-1 flex-col overflow-y-auto">
            <div className="space-y-5 px-6 py-5">

              {/* ── Image section with URL / Upload tabs ── */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="font-mono text-[10px] uppercase tracking-widest text-[#555]">Image</label>
                  <div className="flex overflow-hidden rounded-lg border border-white/10 p-0.5">
                    {(['url', 'upload'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setImageMode(mode)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors',
                          imageMode === mode ? 'bg-[#e8531a] text-white' : 'text-[#555] hover:text-[#888]'
                        )}
                      >
                        {mode === 'url' ? <Link2 className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
                        {mode === 'url' ? 'URL' : 'Upload'}
                      </button>
                    ))}
                  </div>
                </div>

                {imageMode === 'url' ? (
                  <input
                    type="url"
                    placeholder="https://images.pexels.com/…"
                    value={form.imageUrl}
                    onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); setImgPreviewError(false); }}
                    className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                  />
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="img-upload"
                    />
                    <label
                      htmlFor="img-upload"
                      className={cn(
                        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-5 transition-colors',
                        uploading
                          ? 'border-[#e8531a]/40 bg-[#e8531a]/5'
                          : 'border-white/10 bg-[#141414] hover:border-[#e8531a]/30 hover:bg-[#e8531a]/5'
                      )}
                    >
                      {uploading
                        ? <Loader2 className="h-6 w-6 animate-spin text-[#e8531a]" />
                        : <Upload className="h-6 w-6 text-[#555]" />}
                      <span className="text-xs text-[#555]">
                        {uploading ? 'Uploading…' : 'Click to choose a file · max 5 MB'}
                      </span>
                    </label>
                    {form.imageUrl && (
                      <p className="mt-1.5 truncate text-xs text-green-400/80">✓ {form.imageUrl.split('/').pop()}</p>
                    )}
                  </div>
                )}

                {/* Shared preview */}
                <div className="mt-3 h-44 w-full overflow-hidden rounded-xl border border-white/10 bg-[#141414]">
                  {form.imageUrl && !imgPreviewError ? (
                    <div className="relative h-full w-full">
                      <Image
                        src={form.imageUrl}
                        alt="Preview"
                        fill
                        sizes="450px"
                        className="object-cover"
                        unoptimized
                        onError={() => setImgPreviewError(true)}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-[#333]">
                      <ImageIcon className="h-8 w-8" />
                      {imgPreviewError
                        ? <p className="text-xs text-red-400/70">Could not load image</p>
                        : <p className="text-xs">Image preview</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#555]">
                  Name <span className="text-[#e8531a]">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ember Classic"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                />
              </div>

              {/* Category + Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#555]">
                    Category <span className="text-[#e8531a]">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                      className="w-full appearance-none rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 pr-8 text-sm text-[#f5f0e8] outline-none focus:border-[#e8531a]/50"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555]" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#555]">
                    Price ($) <span className="text-[#e8531a]">*</span>
                  </label>
                  <input
                    required type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 font-mono text-sm text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#555]">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe the dish, key ingredients, flavour notes…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 text-sm leading-6 text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                />
              </div>

              {/* Allergens */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#555]">
                  Allergens <span className="text-yellow-500">(FDA required)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wheat, Milk, Eggs, Soy — leave blank if none"
                  value={(form as any).allergens ?? ''}
                  onChange={(e) => setForm({ ...form, allergens: e.target.value } as any)}
                  className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-yellow-500/50"
                />
                <p className="mt-1 text-[11px] text-[#555]">Shown on menu card as a warning badge. List the 9 major allergens present.</p>
              </div>

              {/* Toggles */}
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#141414] p-4">
                <ToggleRow
                  label="Live on menu"
                  sub="Customers can see and order this item"
                  active={form.available}
                  color="green"
                  onToggle={() => setForm({ ...form, available: !form.available })}
                />
                <div className="border-t border-white/5 pt-3">
                  <ToggleRow
                    label="Popular / Featured"
                    sub="Shows Popular badge on the menu card"
                    active={form.featured}
                    color="orange"
                    onToggle={() => setForm({ ...form, featured: !form.featured })}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto border-t border-white/10 px-6 py-4">
              <div className="flex gap-3">
                <button
                  type="button" onClick={closePanel}
                  className="flex-1 rounded-lg border border-white/10 py-3 text-sm font-bold uppercase tracking-wider text-[#888] transition-colors hover:border-white/20 hover:text-[#f5f0e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#ff6b2c] disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </div>
          </form>
        </aside>
      </>

      {/* ── Toast ── */}
      {toast && (
        <div className={cn(
          'fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl',
          toast.type === 'ok'
            ? 'border-green-500/30 bg-[#0d0d0d] text-green-400'
            : 'border-red-500/30 bg-[#0d0d0d] text-red-400'
        )}>
          {toast.type === 'ok'
            ? <Check className="mr-2 inline h-4 w-4" />
            : <AlertTriangle className="mr-2 inline h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, valueClass }: { label: string; value: number; valueClass?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#141414] px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">{label}</p>
      <p className={cn('mt-1 font-display text-3xl text-[#f5f0e8]', valueClass)}>{value}</p>
    </div>
  );
}

function ToggleRow({ label, sub, active, color, onToggle }: {
  label: string; sub: string; active: boolean; color: 'green' | 'orange'; onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-[#f5f0e8]">{label}</p>
        <p className="text-xs text-[#555]">{sub}</p>
      </div>
      <button type="button" onClick={onToggle} className="transition-opacity hover:opacity-80">
        {active
          ? <ToggleRight className={cn('h-8 w-8', color === 'green' ? 'text-green-400' : 'text-[#e8531a]')} />
          : <ToggleLeft className="h-8 w-8 text-[#333]" />}
      </button>
    </div>
  );
}
