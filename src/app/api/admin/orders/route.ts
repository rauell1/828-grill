import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 200);

  const sql = getSql();

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
