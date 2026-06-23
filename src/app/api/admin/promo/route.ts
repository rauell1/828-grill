import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();
  const promos = await sql`
    SELECT id, code, "discountType", "discountValue", status, "usedCount", "maxUses", "expiresAt", "createdAt"
    FROM "PromoCode"
    ORDER BY "createdAt" DESC
  `;

  return NextResponse.json({ promos });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const code = (body.code ?? '').toUpperCase().trim().replace(/\s+/g, '');
  const discountType = body.discountType === 'flat' ? 'flat' : 'pct';
  const discountValue = parseFloat(body.discountValue);
  const maxUses = body.maxUses ? parseInt(body.maxUses) : null;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  if (!code || code.length < 3) return NextResponse.json({ error: 'Code must be at least 3 characters' }, { status: 400 });
  if (!/^[A-Z0-9_-]+$/.test(code)) return NextResponse.json({ error: 'Code can only contain letters, numbers, hyphens and underscores' }, { status: 400 });
  if (isNaN(discountValue) || discountValue <= 0) return NextResponse.json({ error: 'Invalid discount value' }, { status: 400 });
  if (discountType === 'pct' && discountValue > 100) return NextResponse.json({ error: 'Percentage cannot exceed 100' }, { status: 400 });

  const sql = getSql();

  try {
    const [promo] = await sql`
      INSERT INTO "PromoCode" (id, code, "discountType", "discountValue", status, "maxUses", "expiresAt")
      VALUES (${uuidv4()}, ${code}, ${discountType}, ${discountValue}, 'active', ${maxUses}, ${expiresAt})
      RETURNING *
    `;
    return NextResponse.json({ promo }, { status: 201 });
  } catch (err: any) {
    if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
      return NextResponse.json({ error: `Code "${code}" already exists` }, { status: 409 });
    }
    throw err;
  }
}
