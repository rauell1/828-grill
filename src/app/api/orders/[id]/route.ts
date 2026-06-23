import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sql = getSql();
  const userId = session.user.id;

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
    WHERE o.id = ${id} AND o."userId" = ${userId}
    GROUP BY o.id
    LIMIT 1
  `;

  if (!orders.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ order: orders[0] });
}
