'use client';

import { useState } from 'react';
import { MenuCard, MenuItemData } from './menu-card';
import { ItemDetailModal } from './item-detail-modal';
import { Reveal } from './reveal';
import { useUI } from '@/store/ui';
import { ArrowRight } from 'lucide-react';

export function FeaturedSection({ items }: { items: MenuItemData[] }) {
  const setView = useUI((s) => s.setView);
  const featured = items.filter((i) => i.featured || i.popular).slice(0, 4);
  const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);

  if (featured.length === 0) return null;

  return (
    <section id="featured" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-12 max-w-3xl">
          <p className="font-mono text-sm uppercase tracking-[0.32em] text-[#E8531A]">
            Menu reveal
          </p>
          <h2 className="mt-3 font-display text-[5rem] leading-none text-[#F5F0E8] sm:text-[7rem]">
            House Heat
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#888888]">
            Start with the signatures, then build the cart your way.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((item, i) => (
            <Reveal key={item.id} delay={i * 80}>
              <MenuCard item={item} onOpen={setSelectedItem} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10">
          <button
            onClick={() => setView('menu')}
            className="ember-button px-8 py-4 text-sm font-extrabold uppercase tracking-[0.22em] text-white"
          >
            Full Menu
            <ArrowRight className="h-4 w-4" />
          </button>
        </Reveal>
      </div>

      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </section>
  );
}
