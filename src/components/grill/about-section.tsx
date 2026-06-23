'use client';

import { Reveal } from './reveal';

export function AboutSection() {
  return (
    <section className="border-y border-white/10 bg-[#1A1A1A]/40 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <p className="font-mono text-sm uppercase tracking-[0.32em] text-[#E8531A]">
            The craft
          </p>
          <h2 className="mt-3 font-display text-[4.5rem] leading-none text-[#F5F0E8] sm:text-[6rem] lg:text-[7rem]">
            Smoke, Sear, Send It.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className="text-xl leading-9 text-[#F5F0E8]/70">
            828 Grill keeps the menu focused: burgers with real char, sides that
            can hold their own, and combos that move fast from grill to checkout.
            The experience is designed to feel as direct as the food: choose,
            cart, pay, confirm.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
