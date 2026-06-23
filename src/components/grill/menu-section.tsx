'use client';

import { useState, useMemo } from 'react';
import { MenuCard, MenuItemData } from './menu-card';
import { Reveal } from './reveal';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Burgers', 'Sides', 'Drinks', 'Combos'] as const;
type Category = (typeof CATEGORIES)[number];

export function MenuSection({ items }: { items: MenuItemData[] }) {
  const [active, setActive] = useState<Category>('All');

  const filtered = useMemo(() => {
    if (active === 'All') return items;
    return items.filter((i) => i.category === active);
  }, [items, active]);

  return (
    <section id="menu" className="min-h-screen pb-20">
      {/* Header — "THE MENU" at maximum scale, right-aligned filters */}
      <div className="border-b border-white/5 bg-[#141414]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 sm:py-20">
          <p className="mb-3 font-mono text-sm uppercase tracking-[0.32em] text-[#E8531A]">
            Order online
          </p>
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            {/* Left: Heading + description */}
            <div className="max-w-2xl">
              <h1 className="font-display text-[6rem] leading-none text-[#F5F0E8] sm:text-[8rem] lg:text-[9rem]">
                The Menu
              </h1>
              <p className="mt-4 text-lg leading-8 text-[#888888]">
                Filter by category, add to cart, and continue to the checkout flow.
              </p>
            </div>

            {/* Right: Filter tabs — right-aligned on desktop */}
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
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 sm:py-14">
        <Reveal className="mb-8">
          <h2 className="font-display text-3xl text-[#F5F0E8]">
            {active === 'All' ? 'Full Menu' : active}
          </h2>
          <p className="mt-1 text-sm text-[#888888]">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''} available
          </p>
        </Reveal>

        {filtered.length === 0 ? (
          <div className="py-20 text-center text-[#888888]">
            No items in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item, i) => (
              <Reveal key={item.id} delay={(i % 4) * 70}>
                <MenuCard item={item} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
