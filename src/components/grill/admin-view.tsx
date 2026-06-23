'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Plus, Pencil, Trash2, X, Check, Loader2, ChevronDown,
  LayoutGrid, Flame, Search, AlertTriangle, ToggleLeft, ToggleRight,
  Star, ImageIcon, ArrowLeft,
} from 'lucide-react';
import { useUI } from '@/store/ui';
import { cn } from '@/lib/utils';

type Category = 'Burgers' | 'Sides' | 'Drinks' | 'Combos';
const CATEGORIES: Category[] = ['Burgers', 'Sides', 'Drinks', 'Combos'];

interface AdminItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  available: boolean;
  featured: boolean;
}

const EMPTY_FORM: Omit<AdminItem, 'id'> = {
  name: '',
  description: '',
  price: 0,
  category: 'Burgers',
  imageUrl: '',
  available: true,
  featured: false,
};

const CATEGORY_COLORS: Record<Category, string> = {
  Burgers: 'bg-orange-500/15 text-orange-400',
  Sides:   'bg-yellow-500/15 text-yellow-400',
  Drinks:  'bg-blue-500/15 text-blue-400',
  Combos:  'bg-purple-500/15 text-purple-400',
};

export function AdminView() {
  const setView = useUI((s) => s.setView);

  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<Category | 'All'>('All');
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<AdminItem, 'id'>>(EMPTY_FORM);
  const [imgPreviewError, setImgPreviewError] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/menu');
      const data = await res.json();
      if (res.ok) setItems(data.items ?? []);
      else showToast(data.error ?? 'Failed to load items', 'err');
    } catch {
      showToast('Network error', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setImgPreviewError(false);
    setPanelOpen(true);
  };

  const openEdit = (item: AdminItem) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl,
      available: item.available,
      featured: item.featured,
    });
    setImgPreviewError(false);
    setPanelOpen(true);
  };

  const closePanel = () => { setPanelOpen(false); setEditId(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Name is required', 'err'); return; }
    if (form.price <= 0) { showToast('Price must be greater than 0', 'err'); return; }

    setSaving(true);
    try {
      const url = editId ? `/api/admin/menu/${editId}` : '/api/admin/menu';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/menu/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Delete failed');

      if (data.softDeleted) {
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, available: false } : i));
        showToast('Item has orders — marked unavailable', 'ok');
      } else {
        setItems((prev) => prev.filter((i) => i.id !== id));
        showToast('Item deleted');
      }
    } catch (err: any) {
      showToast(err.message ?? 'Delete failed', 'err');
    } finally {
      setDeleteConfirm(null);
    }
  };

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
      // Revert on failure
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, [field]: item[field] } : i));
      showToast('Update failed', 'err');
    }
  };

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

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8531a]">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl tracking-wider text-[#f5f0e8]">
              828 <span className="text-[#e8531a]">ADMIN</span>
            </span>
            <span className="ml-2 rounded-full border border-[#e8531a]/30 bg-[#e8531a]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[#e8531a]">
              CMS
            </span>
          </div>
          <button
            onClick={() => setView('home')}
            className="flex items-center gap-1.5 text-xs font-medium text-[#888] transition-colors hover:text-[#f5f0e8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to site
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-screen-xl flex-1 px-5 py-8">

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-white/10 bg-[#141414] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">Total</p>
            <p className="mt-1 font-display text-3xl text-[#f5f0e8]">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#141414] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">Active</p>
            <p className="mt-1 font-display text-3xl text-green-400">{stats.active}</p>
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat} className="rounded-xl border border-white/10 bg-[#141414] px-5 py-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#555]">{cat}</p>
              <p className="mt-1 font-display text-3xl text-[#f5f0e8]">{stats.byCategory[cat]}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
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
            {/* Category filter */}
            <div className="relative">
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value as Category | 'All')}
                className="h-9 appearance-none rounded-lg border border-white/10 bg-[#141414] pl-3 pr-8 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]/50"
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
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {/* Table */}
        {loading ? (
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
                    {/* Item */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
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

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider', CATEGORY_COLORS[item.category])}>
                        {item.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 text-right font-mono text-[#e8531a]">
                      ${Number(item.price).toFixed(2)}
                    </td>

                    {/* Available toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleField(item, 'available')}
                        aria-label={item.available ? 'Disable item' : 'Enable item'}
                        className="mx-auto flex items-center transition-opacity hover:opacity-80"
                      >
                        {item.available
                          ? <ToggleRight className="h-6 w-6 text-green-400" />
                          : <ToggleLeft className="h-6 w-6 text-[#444]" />}
                      </button>
                    </td>

                    {/* Popular toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleField(item, 'featured')}
                        aria-label={item.featured ? 'Remove popular' : 'Mark popular'}
                        className="mx-auto flex items-center transition-opacity hover:opacity-80"
                      >
                        <Star className={cn('h-4 w-4 transition-colors', item.featured ? 'fill-[#e8531a] text-[#e8531a]' : 'text-[#333]')} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-[#888] transition-colors hover:border-[#e8531a]/40 hover:text-[#e8531a]"
                          aria-label="Edit"
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
                            aria-label="Delete"
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
      </div>

      {/* Edit / Create slide-over panel */}
      <>
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300',
            panelOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={closePanel}
        />

        {/* Panel */}
        <aside
          ref={panelRef}
          className={cn(
            'fixed right-0 top-0 z-[70] flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#0d0d0d] shadow-2xl transition-transform duration-300',
            panelOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          {/* Panel header */}
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

          {/* Panel form */}
          <form onSubmit={handleSave} className="flex flex-1 flex-col overflow-y-auto scroll-area-dark">
            <div className="space-y-5 px-6 py-5">

              {/* Image URL + live preview */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#555]">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.pexels.com/…"
                  value={form.imageUrl}
                  onChange={(e) => { setForm({ ...form, imageUrl: e.target.value }); setImgPreviewError(false); }}
                  className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 text-sm text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                />
                {/* Preview */}
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

              {/* Category + Price row */}
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
                      className="w-full appearance-none rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 pr-8 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a]/50"
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
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={form.price || ''}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 font-mono text-sm text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-[#555]">
                  Description
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the dish, key ingredients, flavour notes…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#141414] px-3 py-2.5 text-sm leading-6 text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 rounded-xl border border-white/10 bg-[#141414] p-4">
                {/* Available */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#f5f0e8]">Live on menu</p>
                    <p className="text-xs text-[#555]">Customers can see and order this item</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, available: !form.available })}
                    className="transition-opacity hover:opacity-80"
                  >
                    {form.available
                      ? <ToggleRight className="h-8 w-8 text-green-400" />
                      : <ToggleLeft className="h-8 w-8 text-[#333]" />}
                  </button>
                </div>
                {/* Popular */}
                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                  <div>
                    <p className="text-sm font-medium text-[#f5f0e8]">Popular / Featured</p>
                    <p className="text-xs text-[#555]">Shows Popular badge and appears in Featured section</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, featured: !form.featured })}
                    className="transition-opacity hover:opacity-80"
                  >
                    {form.featured
                      ? <ToggleRight className="h-8 w-8 text-[#e8531a]" />
                      : <ToggleLeft className="h-8 w-8 text-[#333]" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Panel footer */}
            <div className="mt-auto border-t border-white/10 px-6 py-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closePanel}
                  className="flex-1 rounded-lg border border-white/10 py-3 text-sm font-bold uppercase tracking-wider text-[#888] transition-colors hover:border-white/20 hover:text-[#f5f0e8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
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

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-xl border px-5 py-3 text-sm font-medium shadow-2xl transition-all',
            toast.type === 'ok'
              ? 'border-green-500/30 bg-[#0d0d0d] text-green-400'
              : 'border-red-500/30 bg-[#0d0d0d] text-red-400'
          )}
        >
          {toast.type === 'ok' ? <Check className="mr-2 inline h-4 w-4" /> : <AlertTriangle className="mr-2 inline h-4 w-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
