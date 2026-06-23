import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  const sql = getSql();
  const users = await sql`SELECT id FROM "User" WHERE email = ${session.user.email} LIMIT 1`;
  if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const userId = users[0].id;

  const existing = await sql`
    SELECT id FROM "Order" WHERE id = ${orderId} AND "userId" = ${userId} LIMIT 1
  `;
  if (!existing.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  await sql`UPDATE "Order" SET status = 'paid' WHERE id = ${orderId}`;

  const orders = await sql`
    SELECT
      o.id, o."userId", o.total, o.status, o."stripeId", o."createdAt",
      json_agg(json_build_object(
        'id', oi.id,
        'quantity', oi.quantity,
        'unitPrice', oi."unitPrice",
        'menuItem', json_build_object('name', m.name, 'imageUrl', m."imageUrl", 'category', m.category)
      )) AS items
    FROM "Order" o
    JOIN "OrderItem" oi ON oi."orderId" = o.id
    JOIN "MenuItem" m ON m.id = oi."menuItemId"
    WHERE o.id = ${orderId}
    GROUP BY o.id
    LIMIT 1
  `;

  return NextResponse.json({ order: orders[0] });
}
