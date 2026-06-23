'use client';

import { create } from 'zustand';

export type View =
  | 'home'
  | 'menu'
  | 'checkout'
  | 'account'
  | 'login'
  | 'register'
  | 'order';

interface UIState {
  view: View;
  orderId: string | null;
  cartOpen: boolean;
  setView: (v: View) => void;
  setOrderId: (id: string | null) => void;
  setCartOpen: (o: boolean) => void;
}

export const useUI = create<UIState>((set) => ({
  view: 'home',
  orderId: null,
  cartOpen: false,
  setView: (view) => {
    set({ view });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },
  setOrderId: (orderId) => set({ orderId }),
  setCartOpen: (cartOpen) => set({ cartOpen }),
}));
