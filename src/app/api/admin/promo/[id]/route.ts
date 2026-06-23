import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = params;
  const body = await req.json();
  const sql = getSql();

  // Only allow patching specific safe fields
  const allowed = ['status', 'discountValue', 'maxUses', 'expiresAt'] as const;
  const updates: Record<string, any> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key] === '' ? null : body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  if ('status' in updates && !['active', 'paused', 'disabled'].includes(updates.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  // Build update dynamically
  if ('status' in updates) {
    await sql`UPDATE "PromoCode" SET status = ${updates.status} WHERE id = ${id}`;
  }
  if ('discountValue' in updates) {
    const v = parseFloat(updates.discountValue);
    if (isNaN(v) || v <= 0) return NextResponse.json({ error: 'Invalid discount value' }, { status: 400 });
    await sql`UPDATE "PromoCode" SET "discountValue" = ${v} WHERE id = ${id}`;
  }
  if ('maxUses' in updates) {
    const v = updates.maxUses === null ? null : parseInt(updates.maxUses);
    await sql`UPDATE "PromoCode" SET "maxUses" = ${v} WHERE id = ${id}`;
  }
  if ('expiresAt' in updates) {
    const v = updates.expiresAt === null ? null : new Date(updates.expiresAt);
    await sql`UPDATE "PromoCode" SET "expiresAt" = ${v} WHERE id = ${id}`;
  }

  const [promo] = await sql`SELECT * FROM "PromoCode" WHERE id = ${id}`;
  if (!promo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ promo });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();
  await sql`DELETE FROM "PromoCode" WHERE id = ${params.id}`;
  return NextResponse.json({ ok: true });
}
