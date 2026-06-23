import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

async function ensureAllergens(sql: ReturnType<typeof getSql>) {
  await sql`ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS allergens TEXT`.catch(() => {});
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sql = getSql();
  await ensureAllergens(sql);
  const items = await sql`
    SELECT * FROM "MenuItem"
    ORDER BY category ASC, name ASC
  `;
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { name, description, price, category, imageUrl, available, popular, allergens } = body;

  if (!name?.trim() || !category || price == null) {
    return NextResponse.json({ error: 'name, category, and price are required' }, { status: 400 });
  }

  const VALID_CATEGORIES = ['Burgers', 'Sides', 'Drinks', 'Combos'];
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const sql = getSql();
  await ensureAllergens(sql);
  const id = uuidv4();

  const rows = await sql`
    INSERT INTO "MenuItem" (id, name, description, price, category, "imageUrl", available, featured, allergens)
    VALUES (
      ${id},
      ${String(name).trim()},
      ${description ? String(description).trim() : ''},
      ${Number(price)},
      ${category},
      ${imageUrl ? String(imageUrl).trim() : ''},
      ${available !== false},
      ${popular === true},
      ${allergens ? String(allergens).trim() : null}
    )
    RETURNING *
  `;

  return NextResponse.json({ item: rows[0] }, { status: 201 });
}
