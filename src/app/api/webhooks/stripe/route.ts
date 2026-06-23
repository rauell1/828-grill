import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { sendOrderConfirmationEmail, sendAdminOrderNotificationEmail, type OrderEmailData } from '@/lib/email';

export const runtime = 'nodejs';

async function fetchOrderForEmail(sql: ReturnType<typeof getSql>, orderId: string): Promise<OrderEmailData | null> {
  const rows = await sql`
    SELECT
      o.id, o.total, o."createdAt",
      u.name AS "userName", u.email AS "userEmail",
      json_agg(json_build_object(
        'name', m.name,
        'quantity', oi.quantity,
        'unitPrice', oi."unitPrice"
      ) ORDER BY oi."createdAt") AS items
    FROM "Order" o
    JOIN "User" u ON u.id = o."userId"
    JOIN "OrderItem" oi ON oi."orderId" = o.id
    JOIN "MenuItem" m ON m.id = oi."menuItemId"
    WHERE o.id = ${orderId}
    GROUP BY o.id, u.name, u.email
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: r.id,
    total: r.total,
    createdAt: String(r.createdAt),
    userName: r.userName ?? '',
    userEmail: r.userEmail ?? '',
    items: (r.items ?? []).map((i: any) => ({
      name: i.name ?? '',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    })),
  };
}

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 501 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  let event: any;
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const sql = getSql();

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const orderId = intent.metadata?.orderId;
    if (orderId) {
      await sql`UPDATE "Order" SET status = 'paid' WHERE id = ${orderId} AND status = 'pending'`;
      console.log(`Webhook: order ${orderId} marked paid`);

      const order = await fetchOrderForEmail(sql, orderId);
      if (order) {
        sendOrderConfirmationEmail(order);
        sendAdminOrderNotificationEmail(order);
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const orderId = intent.metadata?.orderId;
    if (orderId) {
      await sql`UPDATE "Order" SET status = 'cancelled' WHERE id = ${orderId} AND status = 'pending'`;
      console.log(`Webhook: order ${orderId} cancelled (payment failed)`);
    }
  }

  return NextResponse.json({ received: true });
}
