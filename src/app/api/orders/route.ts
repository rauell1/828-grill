import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();
  const users = await sql`SELECT id FROM "User" WHERE email = ${session.user.email} LIMIT 1`;
  if (!users.length) return NextResponse.json({ orders: [] });
  const userId = users[0].id;

  const orders = await sql`
    SELECT
      o.id, o."userId", o.total, o.status, o."stripeId", o."createdAt",
      json_agg(json_build_object(
        'id', oi.id,
        'quantity', oi.quantity,
        'unitPrice', oi."unitPrice",
        'menuItem', json_build_object('name', m.name, 'imageUrl', m."imageUrl")
      )) AS items
    FROM "Order" o
    JOIN "OrderItem" oi ON oi."orderId" = o.id
    JOIN "MenuItem" m ON m.id = oi."menuItemId"
    WHERE o."userId" = ${userId}
    GROUP BY o.id
    ORDER BY o."createdAt" DESC
  `;

  return NextResponse.json({ orders });
}
