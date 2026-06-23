'use client';

import { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, AlertTriangle } from 'lucide-react';
import { ImageWithFallback } from './image-fallback';
import { useCart } from '@/store/cart';
import { formatPrice } from '@/lib/format';
import { useToast } from '@/hooks/use-toast';
import type { MenuItemData } from './menu-card';

interface Props {
  item: MenuItemData;
  onClose: () => void;
  restaurantOpen?: boolean;
}

export function ItemDetailModal({ item, onClose, restaurantOpen = true }: Props) {
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const { toast } = useToast();

  const handleAdd = () => {
    if (!restaurantOpen) return;
    add(
      { id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl, category: item.category },
      qty,
    );
    toast({ title: `${qty}× ${item.name} added to cart` });
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        className="fixed left-1/2 top-1/2 z-[90] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1a1a] shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-[#f5f0e8] backdrop-blur-sm transition hover:text-[#e8531a]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <div className="relative h-52 w-full overflow-hidden sm:h-60">
          <ImageWithFallback
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 448px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
          {item.popular && (
            <div className="absolute bottom-4 left-4 rounded-full bg-[#e8531a] px-3 py-1">
              <span className="text-xs font-bold uppercase tracking-wider text-white">Popular</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[#e8531a]">
                {item.category}
              </p>
              <h2 className="font-display text-4xl leading-none text-[#f5f0e8]">{item.name}</h2>
            </div>
            <span className="shrink-0 font-mono text-2xl font-bold text-[#e8531a]">
              {formatPrice(item.price)}
            </span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-[#888888]">{item.description}</p>

          {item.allergens && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/8 px-3 py-2.5 text-xs text-yellow-400">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-bold">Contains:</span> {item.allergens}
              </span>
            </div>
          )}

          {/* Quantity + Add to Cart */}
          <div className="mt-6 flex items-center gap-3">
            {/* Qty stepper */}
            <div className="flex items-center rounded-lg border border-white/10">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                disabled={qty <= 1}
                className="flex h-10 w-10 items-center justify-center text-[#f5f0e8] transition hover:text-[#e8531a] disabled:opacity-40"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-data font-bold text-[#f5f0e8]">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="flex h-10 w-10 items-center justify-center text-[#f5f0e8] transition hover:text-[#e8531a]"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={handleAdd}
              disabled={!restaurantOpen}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#e8531a] py-3 text-sm font-bold uppercase tracking-wider text-[#0d0d0d] transition hover:bg-[#ff6b2c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ember-glow"
            >
              <ShoppingBag className="h-4 w-4" />
              {restaurantOpen
                ? `Add ${qty > 1 ? qty + '×' : ''} · ${formatPrice(item.price * qty)}`
                : 'Currently Closed'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
