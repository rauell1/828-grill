'use client';

import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok || res.status === 200) {
        setStatus('done');
        setMessage(data.message ?? 'You\'re in!');
      } else {
        setStatus('error');
        setMessage(data.error ?? 'Something went wrong. Try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <section className="border-t border-white/5 bg-[#0d0d0d] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">

        {/* Icon */}
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-[#e8531a]/30 bg-[#e8531a]/10">
          <Mail className="h-5 w-5 text-[#e8531a]" />
        </div>

        {/* Heading */}
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.28em] text-[#e8531a]">
          Stay in the loop
        </p>
        <h2 className="font-display text-4xl tracking-wider text-[#f5f0e8] sm:text-5xl">
          FIRST TO KNOW.<br />
          <span className="text-[#e8531a]">FIRST TO EAT.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-base text-[#888]">
          New items, limited specials, and fire-hot deals — straight to your inbox. No spam, only smoke.
        </p>

        {/* Form */}
        <div className="mt-8">
          {status === 'done' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-7 w-7 text-green-400" />
              </div>
              <p className="text-base font-medium text-green-400">{message}</p>
              <p className="text-sm text-[#555]">You'll hear from us when something hot drops.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <div className="relative flex-1 sm:max-w-xs">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#555]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-white/10 bg-[#141414] py-3.5 pl-10 pr-4 text-sm text-[#f5f0e8] outline-none transition-colors placeholder:text-[#444] focus:border-[#e8531a]/50"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#e8531a] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-[#ff6b2c] disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>Subscribe <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </form>
          )}

          {status === 'error' && (
            <p className="mt-3 text-sm text-red-400">{message}</p>
          )}
        </div>

        <p className="mt-5 text-xs text-[#444]">
          Unsubscribe any time. We respect your inbox.
        </p>
      </div>
    </section>
  );
}
