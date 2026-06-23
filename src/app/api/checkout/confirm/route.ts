import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, sessionId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  const sql = getSql();
  const users = await sql`SELECT id FROM "User" WHERE email = ${session.user.email} LIMIT 1`;
  if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const userId = users[0].id;

  const existing = await sql`
    SELECT id, status, "stripeId" FROM "Order" WHERE id = ${orderId} AND "userId" = ${userId} LIMIT 1
  `;
  if (!existing.length) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const order = existing[0];

  // Verify with Stripe if configured and this is a real Stripe PaymentIntent
  if (process.env.STRIPE_SECRET_KEY && sessionId && !sessionId.startsWith('mock_')) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const intent = await stripe.paymentIntents.retrieve(sessionId);
      if (intent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not confirmed' }, { status: 402 });
      }
    } catch (err) {
      console.error('Stripe verify error:', err);
      return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
    }
  }

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
