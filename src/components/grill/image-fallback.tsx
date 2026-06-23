'use client';

import Image, { ImageProps } from 'next/image';
import { useState } from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props extends Omit<ImageProps, 'onError'> {
  fallbackClassName?: string;
}

/**
 * Next.js Image with a branded fallback shown while the src is missing
 * or fails to load. Keeps the layout stable.
 */
export function ImageWithFallback({ alt, className, fallbackClassName, ...rest }: Props) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]',
          className,
          fallbackClassName
        )}
        aria-label={alt}
      >
        <Flame className="h-8 w-8 text-[#e8531a]/40" />
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      onError={() => setErrored(true)}
      {...rest}
    />
  );
}
