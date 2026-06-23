'use client';

import { useState, useMemo, useEffect } from 'react';
import { MenuCard, MenuItemData } from './menu-card';
import { Reveal } from './reveal';
import { cn } from '@/lib/utils';
import { Search, Clock, X } from 'lucide-react';

const CATEGORIES = ['All', 'Burgers', 'Sides', 'Drinks', 'Combos'] as const;
type Category = (typeof CATEGORIES)[number];

interface HoursData {
  isOpen: boolean;
  today: { day: string; display: string } | null;
}

export function MenuSection({ items }: { items: MenuItemData[] }) {
  const [active, setActive] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [hours, setHours] = useState<HoursData | null>(null);

  useEffect(() => {
    fetch('/api/hours')
      .then((r) => r.json())
      .then(setHours)
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let result = active === 'All' ? items : items.filter((i) => i.category === active);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(q));
    }
    return result;
  }, [items, active, search]);

  return (
    <section id="menu" className="min-h-screen pb-20">
      {/* Closed banner */}
      {hours && !hours.isOpen && (
        <div className="border-b border-yellow-500/20 bg-yellow-500/8 px-4 py-3">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <Clock className="h-4 w-4 shrink-0 text-yellow-400" />
            <p className="text-sm text-yellow-300">
              <span className="font-bold">We&apos;re currently closed.</span>{' '}
              {hours.today ? `Today's hours: ${hours.today.display}` : 'Check back soon.'}
              {' '}You can still browse the menu.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-white/5 bg-[#141414]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
          <p className="mb-3 font-mono text-sm uppercase tracking-[0.32em] text-[#E8531A]">
            Order online
          </p>
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="font-display text-[6rem] leading-none text-[#F5F0E8] sm:text-[8rem] lg:text-[9rem]">
                The Menu
              </h1>
              <p className="mt-4 text-lg leading-8 text-[#888888]">
                Filter by category, add to cart, and continue to checkout.
              </p>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={cn(
                    'border px-5 py-3 text-xs font-extrabold uppercase tracking-[0.18em] transition-all',
                    active === cat
                      ? 'border-[#E8531A] bg-[#E8531A] text-white'
                      : 'border-white/15 text-[#F5F0E8]/70 hover:border-[#E8531A]/60 hover:text-[#E8531A]'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mt-8 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
            <input
              type="search"
              placeholder="Search menu…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0d0d0d] py-2.5 pl-9 pr-9 text-sm text-[#f5f0e8] outline-none transition-colors focus:border-[#e8531a] placeholder:text-[#444]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#f5f0e8]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
        <Reveal className="mb-8">
          <h2 className="font-display text-3xl text-[#F5F0E8]">
            {search ? `Results for "${search}"` : active === 'All' ? 'Full Menu' : active}
          </h2>
          <p className="mt-1 text-sm text-[#888888]">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} available
          </p>
        </Reveal>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[#888888]">
              {search ? `No items match "${search}".` : 'No items in this category.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-sm text-[#e8531a] hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item, i) => (
              <Reveal key={item.id} delay={(i % 4) * 70}>
                <MenuCard item={item} restaurantOpen={hours?.isOpen ?? true} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
