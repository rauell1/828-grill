import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export const runtime = 'nodejs';

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
