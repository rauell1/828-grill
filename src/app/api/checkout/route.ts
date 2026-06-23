import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const TAX_RATE = 0.08;
const SERVICE_FEE = 1.5;

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const cartItems: CartItem[] = body.items ?? [];
  if (!cartItems.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 500).trim() : null;
  const promoCode = typeof body.promoCode === 'string' ? body.promoCode.toUpperCase().trim() : null;

  const sql = getSql();
  const ids = cartItems.map((i) => i.id);
  const menuItems = await sql`
    SELECT id FROM "MenuItem" WHERE id = ANY(${ids}::text[]) AND available = true
  `;
  if (menuItems.length !== cartItems.length) {
    return NextResponse.json({ error: 'Some items are unavailable' }, { status: 400 });
  }

  await sql`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS notes TEXT`.catch(() => {});
  await sql`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS discount FLOAT NOT NULL DEFAULT 0`.catch(() => {});
  await sql`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promoCode" TEXT`.catch(() => {});

  const userId = session.user.id;

  const sub = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // Validate promo code from DB and apply discount
  let discount = 0;
  let appliedPromo: string | null = null;
  if (promoCode) {
    const rows = await sql`
      SELECT id, "discountType", "discountValue", status, "usedCount", "maxUses", "expiresAt"
      FROM "PromoCode"
      WHERE code = ${promoCode} AND status = 'active'
      LIMIT 1
    `;
    const dbPromo = rows[0];
    if (
      dbPromo &&
      (dbPromo.maxUses === null || dbPromo.usedCount < dbPromo.maxUses) &&
      (!dbPromo.expiresAt || new Date(dbPromo.expiresAt) > new Date())
    ) {
      discount = dbPromo.discountType === 'pct'
        ? Math.round(sub * (dbPromo.discountValue / 100) * 100) / 100
        : Math.min(dbPromo.discountValue, sub);
      appliedPromo = promoCode;
      // increment usedCount non-blocking — order creation is the authoritative moment
      sql`UPDATE "PromoCode" SET "usedCount" = "usedCount" + 1 WHERE id = ${dbPromo.id}`.catch(() => {});
    }
  }

  const discountedSub = Math.max(0, sub - discount);
  const tax = Math.round(discountedSub * TAX_RATE * 100) / 100;
  const total = Math.round((discountedSub + tax + SERVICE_FEE) * 100) / 100;
  const orderId = uuidv4();

  // Stripe PaymentIntent if configured, otherwise mock
  let stripeId = `mock_${Date.now()}`;
  let clientSecret: string | null = null;

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100), // cents
        currency: 'usd',
        metadata: { orderId, userId },
        description: `828 Grill order ${orderId.slice(-8).toUpperCase()}`,
      });
      stripeId = intent.id;
      clientSecret = intent.client_secret;
    } catch (err) {
      console.error('Stripe PaymentIntent error:', err);
    }
  }

  await sql`
    INSERT INTO "Order" (id, "userId", total, status, "stripeId", notes, discount, "promoCode", "createdAt")
    VALUES (${orderId}, ${userId}, ${total}, 'pending', ${stripeId}, ${notes || null}, ${discount}, ${appliedPromo}, NOW())
  `;

  for (const item of cartItems) {
    await sql`
      INSERT INTO "OrderItem" (id, "orderId", "menuItemId", quantity, "unitPrice")
      VALUES (${uuidv4()}, ${orderId}, ${item.id}, ${item.quantity}, ${item.price})
    `;
  }

  return NextResponse.json({
    order: { id: orderId, total, discount, appliedPromo, status: 'pending', stripeId },
    session: { id: stripeId, clientSecret },
    stripeEnabled: !!clientSecret,
  });
}
