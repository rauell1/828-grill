'use client';

import Image from 'next/image';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useUI } from '@/store/ui';

export function Hero() {
  const setView = useUI((s) => s.setView);

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/menu/hero.jpg"
          alt="Grill with flames and burgers cooking"
          fill
          priority
          sizes="100vw"
          className="hero-photo object-cover"
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute inset-0 smoke-overlay" />
      </div>

      {/* Content — left-aligned */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl hero-copy">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#E8531A]/30 bg-[#E8531A]/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8531A] ember-pulse" />
            <p className="font-mono text-xs uppercase tracking-[0.38em] text-[#E8531A]">
              Asheville heat. Built to order.
            </p>
          </div>

          {/* Headline — "FIRE-KISSED FLAVORS" with ember gradient */}
          <h1 className="font-display leading-[0.85] tracking-[0.04em]">
            <span className="block text-[5.5rem] sm:text-[7.5rem] lg:text-[10rem] ember-gradient">
              FIRE-KISSED
            </span>
            <span className="block text-[5.5rem] sm:text-[7.5rem] lg:text-[10rem] text-[#F5F0E8]">
              FLAVORS
            </span>
          </h1>

          {/* Sub-brand */}
          <h2 className="mt-2 font-display text-[2rem] leading-none tracking-[0.04em] text-[#F5F0E8]/60 sm:text-[2.8rem]">
            828 GRILL — Asheville, NC
          </h2>

          {/* Body */}
          <p className="mt-6 max-w-xl text-base leading-8 text-[#F5F0E8]/70 sm:text-lg">
            Dark-char sears, smoky sauces, and hot-off-the-grill combos made
            for pickup or delivery.
          </p>

          {/* Single CTA */}
          <button
            onClick={() => setView('menu')}
            className="ember-button mt-8 px-8 py-4 text-sm font-extrabold uppercase tracking-[0.22em] text-white"
          >
            Order Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 scroll-bounce">
        <div className="flex flex-col items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#F5F0E8]/40">
            Scroll
          </span>
          <ChevronDown className="h-5 w-5 text-[#E8531A]" />
        </div>
      </div>
    </section>
  );
}
