import { NextResponse } from 'next/server';

// Promo codes — move to DB (PromoCode table) when you need dynamic management
const PROMOS: Record<string, { type: 'pct' | 'flat'; value: number; label: string }> = {
  FIRE15:    { type: 'pct',  value: 15,  label: '15% off your order' },
  GRILL20:   { type: 'pct',  value: 20,  label: '20% off your order' },
  WELCOME10: { type: 'flat', value: 10,  label: '$10 off your order' },
  FIRSTBITE: { type: 'pct',  value: 10,  label: '10% off your order' },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') ?? '').toUpperCase().trim();

  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });

  const promo = PROMOS[code];
  if (!promo) return NextResponse.json({ valid: false, error: 'Invalid promo code' }, { status: 404 });

  return NextResponse.json({ valid: true, code, ...promo });
}

export type PromoResult = {
  valid: boolean;
  code: string;
  type: 'pct' | 'flat';
  value: number;
  label: string;
};
