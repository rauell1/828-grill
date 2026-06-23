import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

const VALID_STATUSES = ['pending', 'paid', 'preparing', 'ready', 'delivered', 'cancelled', 'confirmed'];

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sql = getSql();

  const [orderRows, itemRows] = await Promise.all([
    sql`
      SELECT o.id, o.total::float, o.status, o."stripeId", o."createdAt",
             u.name AS "customerName", u.email AS "customerEmail",
             u.phone AS "customerPhone", u.address AS "customerAddress"
      FROM "Order" o JOIN "User" u ON u.id = o."userId"
      WHERE o.id = ${id}
    `,
    sql`
      SELECT oi.id, oi.quantity::int, oi."unitPrice"::float,
             m.name AS "itemName", m.category, m."imageUrl"
      FROM "OrderItem" oi
      JOIN "MenuItem" m ON m.id = oi."menuItemId"
      WHERE oi."orderId" = ${id}
    `,
  ]);

  if (!orderRows.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  return NextResponse.json({ order: orderRows[0], items: itemRows });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const sql = getSql();
  await sql`UPDATE "Order" SET status = ${status} WHERE id = ${id}`;

  return NextResponse.json({ ok: true, status });
}
