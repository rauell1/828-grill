import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { name, description, price, category, imageUrl, available, popular, allergens } = body;

  const VALID_CATEGORIES = ['Burgers', 'Sides', 'Drinks', 'Combos'];
  if (category && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const { stockCount } = body;
  const sql = getSql();
  await sql`ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS allergens TEXT`.catch(() => {});
  await sql`ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "stockCount" INT`.catch(() => {});

  const rows = await sql`
    UPDATE "MenuItem"
    SET
      name          = COALESCE(${name ? String(name).trim() : null}, name),
      description   = COALESCE(${description != null ? String(description).trim() : null}, description),
      price         = COALESCE(${price != null ? Number(price) : null}, price),
      category      = COALESCE(${category ?? null}, category),
      "imageUrl"    = COALESCE(${imageUrl != null ? String(imageUrl).trim() : null}, "imageUrl"),
      available     = COALESCE(${available != null ? Boolean(available) : null}, available),
      featured      = COALESCE(${popular != null ? Boolean(popular) : null}, featured),
      allergens     = CASE WHEN ${allergens !== undefined} THEN ${allergens ? String(allergens).trim() : null} ELSE allergens END,
      "stockCount"  = CASE WHEN ${stockCount !== undefined} THEN ${stockCount != null ? parseInt(stockCount) : null} ELSE "stockCount" END
    WHERE id = ${id}
    RETURNING *
  `;

  if (!rows.length) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  return NextResponse.json({ item: rows[0] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const sql = getSql();

  // Check if item is referenced by any orders
  const refs = await sql`SELECT id FROM "OrderItem" WHERE "menuItemId" = ${id} LIMIT 1`;
  if (refs.length > 0) {
    // Soft-delete: mark unavailable instead of hard delete
    await sql`UPDATE "MenuItem" SET available = false WHERE id = ${id}`;
    return NextResponse.json({ softDeleted: true, message: 'Item has orders — marked unavailable instead of deleted.' });
  }

  await sql`DELETE FROM "MenuItem" WHERE id = ${id}`;
  return NextResponse.json({ deleted: true });
}
