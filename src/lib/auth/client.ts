'use client';

import { useState, useEffect } from 'react';

interface SessionUser { id: string; name: string; email: string; }
interface Session { user: SessionUser; }

// Singleton session state — shared across all hook instances
let _session: Session | null | undefined = undefined; // undefined = still loading
const _listeners = new Set<() => void>();

function notifyListeners() {
  _listeners.forEach((fn) => fn());
}

function setGlobalSession(s: Session | null) {
  _session = s;
  notifyListeners();
}

let _initialized = false;
function initSession() {
  if (_initialized || typeof window === 'undefined') return;
  _initialized = true;
  fetch('/api/auth/session')
    .then((r) => r.json())
    .then((d: { user: SessionUser | null }) => setGlobalSession(d.user ? { user: d.user } : null))
    .catch(() => setGlobalSession(null));
}

function useSession() {
  const [, rerender] = useState(0);

  useEffect(() => {
    initSession();
    const listener = () => rerender((n) => n + 1);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  return {
    data: _session === undefined ? null : _session,
    isPending: _session === undefined,
  };
}

export const authClient = {
  useSession,

  signIn: {
    async email({ email, password }: { email: string; password: string }) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: { message: data.error ?? 'Sign in failed' } };
      setGlobalSession({ user: data.user });
      return { error: null };
    },
  },

  signUp: {
    async email({
      email,
      password,
      name,
      phone,
      address,
      newsletterSubscribed,
    }: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      address?: string;
      newsletterSubscribed?: boolean;
    }) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone, address, newsletterSubscribed }),
      });
      const data = await res.json();
      if (!res.ok) return { error: { message: data.error ?? 'Registration failed' } };
      setGlobalSession({ user: data.user });
      return { error: null };
    },
  },

  async signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setGlobalSession(null);
    // Clear cart so the next user on this browser doesn't see previous items
    if (typeof window !== 'undefined') {
      try {
        const { useCart } = await import('@/store/cart');
        useCart.getState().clear();
      } catch { /* store not yet loaded */ }
    }
  },
};
