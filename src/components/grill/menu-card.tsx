'use client';

import Image from 'next/image';
import { Star } from 'lucide-react';

export interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  featured?: boolean;
  popular?: boolean;
  available?: boolean;
  allergens?: string;
  stockCount?: number | null;
}

interface Props {
  item: MenuItemData;
  restaurantOpen?: boolean;
  onOpen: (item: MenuItemData) => void;
}

export function MenuCard({ item, restaurantOpen = true, onOpen }: Props) {
  return (
    <article
      className="group flex cursor-pointer flex-col overflow-hidden border border-white/5 bg-[#1A1A1A] transition duration-500 hover:-translate-y-1 hover:border-[#E8531A]/25 hover:bg-[#211814]"
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${item.name}`}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(item)}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-4 font-mono text-xs uppercase tracking-[0.26em] text-[#E8531A]">
          {item.category}
        </div>
        {item.popular && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#E8531A] px-2.5 py-1">
            <Star className="h-3 w-3 fill-white text-white" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              Popular
            </span>
          </div>
        )}
        {item.stockCount != null && item.stockCount > 0 && item.stockCount <= 5 && (
          <div className="absolute left-3 top-3 rounded-full bg-yellow-500/90 px-2.5 py-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-black">
              Only {item.stockCount} left
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-[2.2rem] leading-none text-[#F5F0E8]">{item.name}</h3>
          <p className="flex-shrink-0 font-mono text-lg text-[#E8531A]">
            ${item.price.toFixed(2)}
          </p>
        </div>

        <p className="mt-4 flex-1 text-sm leading-6 text-[#888888] line-clamp-2">
          {item.description}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(item);
          }}
          disabled={!restaurantOpen}
          aria-label={restaurantOpen ? `Add ${item.name} to cart` : 'Restaurant is currently closed'}
          className={`mt-6 border px-4 py-3 text-sm font-extrabold uppercase tracking-[0.18em] transition-all ${
            !restaurantOpen
              ? 'cursor-not-allowed border-white/10 text-[#555]'
              : 'border-[#E8531A]/50 text-[#F5F0E8] hover:border-[#E8531A] hover:bg-[#E8531A] hover:text-white'
          }`}
        >
          {restaurantOpen ? 'Add to Cart' : 'Closed'}
        </button>
      </div>
    </article>
  );
}
