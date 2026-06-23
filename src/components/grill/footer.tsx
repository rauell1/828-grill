'use client';

import Link from 'next/link';
import { useUI, View } from '@/store/ui';

export function Footer() {
  const setView = useUI((s) => s.setView);
  const go = (v: View) => () => setView(v);

  return (
    <footer className="mt-auto border-t border-white/5 bg-[#0D0D0D]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
          {/* Brand */}
          <div>
            <button onClick={go('home')} className="block">
              <span className="font-display text-3xl text-[#F5F0E8]">
                828 <span className="text-[#E8531A]">GRILL</span>
              </span>
            </button>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[#888]">
              Dark grill-house ordering for 828 Grill LLC.
            </p>
          </div>

          {/* Right links */}
          <div className="flex items-center gap-8">
            <button
              onClick={go('menu')}
              className="text-xs font-bold uppercase tracking-[0.18em] text-[#888] transition-colors hover:text-[#E8531A]"
            >
              Menu
            </button>
            <button
              onClick={go('menu')}
              className="text-xs font-bold uppercase tracking-[0.18em] text-[#888] transition-colors hover:text-[#E8531A]"
            >
              Cart
            </button>
            <a
              href="https://instagram.com/828grill"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-[0.18em] text-[#888] transition-colors hover:text-[#E8531A]"
            >
              @828grill
            </a>
          </div>
        </div>

        {/* Bottom rule + copyright */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 sm:flex-row">
          <p className="text-xs text-[#888]">
            © {new Date().getFullYear()} 828 Grill LLC. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-[#666] transition-colors hover:text-[#E8531A]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-[#666] transition-colors hover:text-[#E8531A]">
              Terms of Service
            </Link>
            <span className="text-xs text-[#444]">EST. 828 · CRAFTED WITH FIRE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
