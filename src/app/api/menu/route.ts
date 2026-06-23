import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET() {
  try {
    const sql = getSql();
    await sql`ALTER TABLE "MenuItem" ADD COLUMN IF NOT EXISTS "stockCount" INT`.catch(() => {});
    const items = await sql`
      SELECT * FROM "MenuItem"
      WHERE available = true AND ("stockCount" IS NULL OR "stockCount" > 0)
      ORDER BY category ASC, name ASC
    `;
    return NextResponse.json({ items });
  } catch (err) {
    console.error('[/api/menu]', err);
    return NextResponse.json({ error: 'Failed to load menu' }, { status: 500 });
  }
}
