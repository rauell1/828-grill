'use client';

import { Flame } from 'lucide-react';

const ITEMS = [
  'HAND-SMASHED PATTIES',
  'SLOW-SMOKED DAILY',
  'HOUSE-MADE SAUCES',
  'FRESH NEVER FROZEN',
  'CHARCOAL GRILLED',
  'CRAFTED TO ORDER',
  'LOCAL · INDEPENDENT',
  'EST. 828',
];

export function Marquee() {
  const loop = [...ITEMS, ...ITEMS];
  return (
    <div className="relative overflow-hidden border-y border-[#e8531a]/30 bg-[#0d0d0d] py-4">
      <div className="flex w-max animate-marquee items-center gap-8 whitespace-nowrap">
        {loop.map((item, i) => (
          <div key={i} className="flex items-center gap-8">
            <span className="font-display text-2xl tracking-wider text-[#f5f0e8]/70">
              {item}
            </span>
            <Flame className="h-5 w-5 shrink-0 text-[#e8531a]" />
          </div>
        ))}
      </div>
    </div>
  );
}
