'use client';

import { Reveal } from './reveal';
import { Flame, UtensilsCrossed, Zap } from 'lucide-react';

const WHY_CARDS = [
  {
    icon: Flame,
    title: 'Real Fire',
    body: 'Every patty hits a live-flame grill. No steam, no shortcuts — just the char that actually makes a burger.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Craft Ingredients',
    body: 'Locally-sourced beef, scratch sauces, and brioche baked daily. The details are the difference.',
  },
  {
    icon: Zap,
    title: 'Speed & Quality',
    body: 'From order to pickup in under 10 minutes. Fast because we prep right, not because we cut corners.',
  },
];

const STATS = [
  { value: '50K+', label: 'Orders fired' },
  { value: '4.9★', label: 'Average rating' },
  { value: '24/7', label: 'Passion' },
];

export function AboutSection() {
  return (
    <section className="border-y border-white/10 bg-[#1A1A1A]/40 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-20">

        {/* Why 828? Cards */}
        <div>
          <Reveal className="mb-12">
            <p className="font-mono text-sm uppercase tracking-[0.32em] text-[#E8531A]">
              Why 828?
            </p>
            <h2 className="mt-3 font-display text-[4rem] leading-none text-[#F5F0E8] sm:text-[5.5rem]">
              Built Different.
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {WHY_CARDS.map((card, i) => (
              <Reveal key={card.title} delay={i * 100}>
                <div className="rounded-xl border border-white/10 bg-[#141414] p-7 transition-colors hover:border-[#E8531A]/25">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-[#E8531A]/10">
                    <card.icon className="h-5 w-5 text-[#E8531A]" />
                  </div>
                  <h3 className="font-display text-[2rem] leading-none text-[#F5F0E8]">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#888888]">{card.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <Reveal>
          <div className="grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-[#141414]">
            {STATS.map((stat) => (
              <div key={stat.label} className="px-8 py-10 text-center">
                <p className="font-display text-[3.5rem] leading-none ember-gradient sm:text-[4.5rem]">
                  {stat.value}
                </p>
                <p className="mt-2 font-mono text-xs uppercase tracking-[0.22em] text-[#888888]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* The craft — original copy */}
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
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

      </div>
    </section>
  );
}
