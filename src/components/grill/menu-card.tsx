'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { useCart } from '@/store/cart';
import { useToast } from '@/hooks/use-toast';

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
}

export function MenuCard({ item }: { item: MenuItemData }) {
  const add = useCart((s) => s.add);
  const { toast } = useToast();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        category: item.category,
      },
      1
    );
    setAdded(true);
    toast({ title: 'Added to cart', description: item.name });
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="group flex flex-col overflow-hidden border border-white/5 bg-[#1A1A1A] transition duration-500 hover:-translate-y-1 hover:border-[#E8531A]/25 hover:bg-[#211814]">
      {/* Image with category overlay */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
        />
        {/* Gradient from bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/80 via-transparent to-transparent" />
        {/* Category label — overlaid bottom-left of image */}
        <div className="absolute bottom-3 left-4 font-mono text-xs uppercase tracking-[0.26em] text-[#E8531A]">
          {item.category}
        </div>
        {/* Popular badge */}
        {item.popular && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#E8531A] px-2.5 py-1">
            <Star className="h-3 w-3 fill-white text-white" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              Popular
            </span>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Name + price row */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-[2.2rem] leading-none text-[#F5F0E8]">
            {item.name}
          </h3>
          <p className="flex-shrink-0 font-mono text-lg text-[#E8531A]">
            ${item.price.toFixed(2)}
          </p>
        </div>

        {/* Description */}
        <p className="mt-4 flex-1 text-sm leading-6 text-[#888888]">
          {item.description}
        </p>

        {/* Ghost outline Add to Cart button */}
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Add ${item.name} to cart`}
          className={`mt-6 border px-4 py-3 text-sm font-extrabold uppercase tracking-[0.18em] transition-all ${
            added
              ? 'border-green-500/50 bg-green-500/10 text-green-400'
              : 'border-[#E8531A]/50 text-[#F5F0E8] hover:border-[#E8531A] hover:bg-[#E8531A] hover:text-white'
          }`}
        >
          {added ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </article>
  );
}
