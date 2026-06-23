import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { orderId, foodRating, serviceRating, comment } = body;

  if (!orderId || !foodRating || !serviceRating) {
    return NextResponse.json({ error: 'orderId, foodRating and serviceRating are required' }, { status: 400 });
  }
  if (![1, 2, 3, 4, 5].includes(Number(foodRating)) || ![1, 2, 3, 4, 5].includes(Number(serviceRating))) {
    return NextResponse.json({ error: 'Ratings must be 1–5' }, { status: 400 });
  }

  const sql = getSql();

  // Verify the order belongs to this user and is delivered
  const orders = await sql`
    SELECT id FROM "Order"
    WHERE id = ${orderId} AND "userId" = ${session.user.id} AND status = 'delivered'
    LIMIT 1
  `;
  if (!orders.length) {
    return NextResponse.json({ error: 'Order not found or not yet delivered' }, { status: 404 });
  }

  // Upsert feedback (allow re-submit)
  await sql`
    INSERT INTO "Feedback" (id, "orderId", "userId", "foodRating", "serviceRating", comment, "createdAt")
    VALUES (${uuidv4()}, ${orderId}, ${session.user.id}, ${Number(foodRating)}, ${Number(serviceRating)},
            ${comment ? String(comment).slice(0, 500).trim() : null}, NOW())
    ON CONFLICT ("orderId") DO UPDATE
      SET "foodRating" = EXCLUDED."foodRating",
          "serviceRating" = EXCLUDED."serviceRating",
          comment = EXCLUDED.comment
  `;

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const sql = getSql();
  const rows = await sql`
    SELECT id, "foodRating", "serviceRating", comment FROM "Feedback"
    WHERE "orderId" = ${orderId} AND "userId" = ${session.user.id}
    LIMIT 1
  `;

  return NextResponse.json({ feedback: rows[0] ?? null });
}
