import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sql = getSql();
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
  const { name, description, price, category, imageUrl, available, popular } = body;

  if (!name?.trim() || !category || price == null) {
    return NextResponse.json({ error: 'name, category, and price are required' }, { status: 400 });
  }

  const VALID_CATEGORIES = ['Burgers', 'Sides', 'Drinks', 'Combos'];
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const sql = getSql();
  const id = uuidv4();

  const rows = await sql`
    INSERT INTO "MenuItem" (id, name, description, price, category, "imageUrl", available, featured)
    VALUES (
      ${id},
      ${String(name).trim()},
      ${description ? String(description).trim() : ''},
      ${Number(price)},
      ${category},
      ${imageUrl ? String(imageUrl).trim() : ''},
      ${available !== false},
      ${popular === true}
    )
    RETURNING *
  `;

  return NextResponse.json({ item: rows[0] }, { status: 201 });
}
