'use client';

import Image from 'next/image';
import { Reveal } from './reveal';
import { useUI } from '@/store/ui';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  const setView = useUI((s) => s.setView);
  return (
    <section className="relative overflow-hidden py-32 px-4 sm:px-6 lg:px-8">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1600"
          alt="Meat sizzling on a live-fire grill"
          fill
          sizes="100vw"
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/80 to-[#0d0d0d]/60" />
      </div>

      <Reveal className="relative z-10 mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
        <div className="max-w-3xl">
          <p className="mb-3 font-mono text-sm uppercase tracking-[0.32em] text-[#E8531A]">
            Don&apos;t wait
          </p>
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
