import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { orderId, sessionId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  const sql = getSql();
  const userId = session.user.id;

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

  const wasAlreadyPaid = order.status === 'paid';
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

  // Send emails only if this call actually transitioned the order to paid
  // (not on duplicate confirm calls from the same session)
  if (!wasAlreadyPaid && orders[0]) {
    const o = orders[0];
    const emailData = {
      id: o.id,
      total: o.total,
      createdAt: o.createdAt,
      userName: o.userName ?? session.user.name ?? '',
      userEmail: session.user.email ?? '',
      items: (o.items ?? []).map((i: any) => ({
        name: i.menuItem?.name ?? i.name ?? '',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
    sendOrderConfirmationEmail(emailData);
    sendAdminOrderNotificationEmail(emailData);
  }

  return NextResponse.json({ order: orders[0] });
}
