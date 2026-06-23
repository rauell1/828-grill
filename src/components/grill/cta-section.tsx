'use client';

import { Reveal } from './reveal';
import { useUI } from '@/store/ui';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  const setView = useUI((s) => s.setView);
  return (
    <section className="px-4 py-24 sm:px-6 lg:px-8">
      <Reveal className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <h2 className="font-display text-[4.5rem] leading-none text-[#F5F0E8] sm:text-[6rem] lg:text-[7rem]">
            Ready for fire?
          </h2>
          <p className="mt-4 text-lg text-[#888888]">
            Browse the full 828 Grill menu and checkout in minutes.
          </p>
        </div>
        <button
          onClick={() => setView('menu')}
          className="ember-button flex-shrink-0 px-8 py-4 text-sm font-extrabold uppercase tracking-[0.22em] text-white"
        >
          Full Menu
          <ArrowRight className="h-4 w-4" />
        </button>
      </Reveal>
    </section>
  );
}
