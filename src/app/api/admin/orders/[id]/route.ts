import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';
import { sendOrderStatusEmail, type OrderEmailData } from '@/lib/email';

const VALID_STATUSES = ['pending', 'paid', 'preparing', 'ready', 'delivered', 'cancelled', 'confirmed'];
const EMAIL_STATUSES = new Set(['preparing', 'ready', 'delivered', 'cancelled']);

async function fetchOrderForEmail(sql: any, orderId: string): Promise<OrderEmailData | null> {
  const rows = await sql`
    SELECT o.id, o.total::float, o."createdAt",
           u.name AS "userName", u.email AS "userEmail",
           json_agg(json_build_object(
             'name', m.name,
             'quantity', oi.quantity::int,
             'unitPrice', oi."unitPrice"::float
           )) AS items
    FROM "Order" o
    LEFT JOIN "User" u ON u.id = o."userId"
    JOIN "OrderItem" oi ON oi."orderId" = o.id
    JOIN "MenuItem" m ON m.id = oi."menuItemId"
    WHERE o.id = ${orderId}
    GROUP BY o.id, u.name, u.email
    LIMIT 1
  `;
  if (!rows.length) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: r.id,
    total: r.total,
    createdAt: r.createdAt,
    userName: r.userName,
    userEmail: r.userEmail,
    items: (r.items ?? []).map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sql = getSql();

  const [orderRows, itemRows] = await Promise.all([
    sql`
      SELECT o.id, o.total::float, o.status, o."stripeId", o."createdAt", o.notes,
             o."preparingAt", o."readyAt", o."deliveredAt", o."cancelledAt",
             COALESCE(u.name, o."guestName", 'Guest') AS "customerName",
             COALESCE(u.email, o."guestEmail", '') AS "customerEmail",
             u.phone AS "customerPhone", u.address AS "customerAddress"
      FROM "Order" o LEFT JOIN "User" u ON u.id = o."userId"
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

  // Build timestamp update based on new status
  const now = new Date().toISOString();
  if (status === 'preparing') {
    await sql`UPDATE "Order" SET status = ${status}, "preparingAt" = ${now} WHERE id = ${id}`;
  } else if (status === 'ready') {
    await sql`UPDATE "Order" SET status = ${status}, "readyAt" = ${now} WHERE id = ${id}`;
  } else if (status === 'delivered') {
    await sql`UPDATE "Order" SET status = ${status}, "deliveredAt" = ${now} WHERE id = ${id}`;
  } else if (status === 'cancelled') {
    await sql`UPDATE "Order" SET status = ${status}, "cancelledAt" = ${now} WHERE id = ${id}`;
  } else {
    await sql`UPDATE "Order" SET status = ${status} WHERE id = ${id}`;
  }

  // Send status email (non-blocking, only for relevant statuses)
  if (EMAIL_STATUSES.has(status)) {
    fetchOrderForEmail(sql, id)
      .then((order) => {
        if (order) {
          return sendOrderStatusEmail(order, status as any);
        }
      })
      .catch(() => {});
  }

  return NextResponse.json({ ok: true, status });
}
