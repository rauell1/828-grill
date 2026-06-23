import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') ?? '').toUpperCase().trim();

  if (!code) return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });

  const sql = getSql();
  const rows = await sql`
    SELECT id, code, "discountType", "discountValue", status, "usedCount", "maxUses", "expiresAt"
    FROM "PromoCode"
    WHERE code = ${code}
    LIMIT 1
  `;

  const promo = rows[0];

  if (!promo) return NextResponse.json({ valid: false, error: 'Invalid promo code' }, { status: 404 });
  if (promo.status !== 'active') return NextResponse.json({ valid: false, error: 'This promo code is not currently active' }, { status: 400 });
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return NextResponse.json({ valid: false, error: 'This promo code has reached its usage limit' }, { status: 400 });
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return NextResponse.json({ valid: false, error: 'This promo code has expired' }, { status: 400 });

  const label = promo.discountType === 'pct'
    ? `${promo.discountValue}% off your order`
    : `$${promo.discountValue.toFixed(2)} off your order`;

  return NextResponse.json({ valid: true, code: promo.code, type: promo.discountType, value: promo.discountValue, label });
}
