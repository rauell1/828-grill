import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200);
  const live = searchParams.get('live') === '1';

  const sql = getSql();

  if (live) {
    // KDS mode: active orders with items + notes inline, sorted oldest-first
    const ACTIVE = ['pending', 'paid', 'confirmed', 'preparing', 'ready'];
    const orders = await sql`
      SELECT
        o.id,
        o.total::float,
        o.status,
        o."createdAt",
        o.notes,
        u.name   AS "customerName",
        u.email  AS "customerEmail",
        u.phone  AS "customerPhone",
        SUM(oi.quantity)::int AS "totalUnits",
        json_agg(json_build_object(
          'name', m.name,
          'quantity', oi.quantity
        ) ORDER BY oi.id) AS items
      FROM "Order" o
      JOIN "User" u ON u.id = o."userId"
      JOIN "OrderItem" oi ON oi."orderId" = o.id
      JOIN "MenuItem" m ON m.id = oi."menuItemId"
      WHERE o.status = ANY(${ACTIVE})
      GROUP BY o.id, u.name, u.email, u.phone
      ORDER BY o."createdAt" ASC
    `;
    return NextResponse.json({ orders });
  }

  const orders = await sql`
    SELECT
      o.id,
      o.total::float,
      o.status,
      o."stripeId",
      o."createdAt",
      u.name   AS "customerName",
      u.email  AS "customerEmail",
      COUNT(oi.id)::int             AS "itemCount",
      SUM(oi.quantity)::int         AS "totalUnits"
    FROM "Order" o
    JOIN "User" u ON u.id = o."userId"
    LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
    WHERE ${status ? sql`o.status = ${status}` : sql`TRUE`}
    GROUP BY o.id, u.name, u.email
    ORDER BY o."createdAt" DESC
    LIMIT ${limit}
  `;

  return NextResponse.json({ orders });
}
