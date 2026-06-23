'use client';

import { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/next';
import Link from 'next/link';

const STORAGE_KEY = 'cookie_consent';

export function CookieConsent() {
  const [consent, setConsent] = useState<'accepted' | 'declined' | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'accepted' || stored === 'declined') {
      setConsent(stored as 'accepted' | 'declined');
    } else {
      // Slight delay so banner doesn't flash on initial hydration
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setConsent('accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setConsent('declined');
    setVisible(false);
  };

  return (
    <>
      {/* Only load Analytics after explicit consent */}
      {consent === 'accepted' && <Analytics />}

      {/* Banner */}
      {visible && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#141414] px-4 py-4 shadow-2xl sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-sm sm:rounded-xl sm:border"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#E8531A]">
            Cookie Notice
          </p>
          <p className="mt-1.5 text-sm leading-6 text-[#999]">
            We use cookies for authentication and, with your consent, anonymous analytics to improve
            the site. See our{' '}
            <Link href="/privacy" className="text-[#F5F0E8] underline hover:text-[#E8531A]">
              Privacy Policy
            </Link>{' '}
            for details.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={accept}
              className="flex-1 bg-[#E8531A] px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[#d44a15]"
            >
              Accept
            </button>
            <button
              onClick={decline}
              className="flex-1 border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#888] transition hover:border-white/25 hover:text-[#F5F0E8]"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </>
  );
}
