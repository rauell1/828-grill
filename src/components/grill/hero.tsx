'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
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

      {/* Content — left-aligned, NOT centered (ZIP 1) */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl hero-copy">
          {/* Eyebrow — orange monospace, 0.38em tracking */}
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.38em] text-[#E8531A] sm:text-sm">
            Asheville heat. Built to order.
          </p>

          {/* Brand name at maximum Bebas Neue scale */}
          <h1 className="font-display text-[6rem] leading-[0.85] tracking-[0.04em] text-[#F5F0E8] sm:text-[8rem] lg:text-[11rem]">
            828 GRILL
          </h1>

          {/* Tagline — secondary display */}
          <h2 className="mt-4 font-display text-[2.8rem] leading-none tracking-[0.04em] text-[#F5F0E8]/90 sm:text-[4rem] lg:text-[5rem]">
            Fire-built burgers for serious appetites.
          </h2>

          {/* Body */}
          <p className="mt-6 max-w-xl text-base leading-8 text-[#F5F0E8]/70 sm:text-lg">
            Dark-char sears, smoky sauces, and hot-off-the-grill combos made
            for pickup or delivery.
          </p>

          {/* Single CTA — no ghost button competing */}
          <button
            onClick={() => setView('menu')}
            className="ember-button mt-8 px-8 py-4 text-sm font-extrabold uppercase tracking-[0.22em] text-white"
          >
            Order Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
