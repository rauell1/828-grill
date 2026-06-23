import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const TAX_RATE = parseFloat(process.env.TAX_RATE ?? '0.08');
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

  const body = await req.json();
  const cartItems: CartItem[] = body.items ?? [];
  if (!cartItems.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });

  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 500).trim() : null;
  const promoCode = typeof body.promoCode === 'string' ? body.promoCode.toUpperCase().trim() : null;
  const tipAmount = typeof body.tip === 'number' && body.tip >= 0
    ? Math.round(body.tip * 100) / 100
    : 0;

  // Auth or guest
  const userId: string | null = session?.user?.id ?? null;
  let guestEmail: string | null = null;
  let guestName: string | null = null;

  if (!userId) {
    guestEmail = typeof body.guestEmail === 'string' ? body.guestEmail.toLowerCase().trim() : null;
    guestName = typeof body.guestName === 'string' ? body.guestName.trim().slice(0, 100) : null;
    if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return NextResponse.json({ error: 'A valid email address is required to place an order' }, { status: 400 });
    }
  }

  const sql = getSql();
  const ids = cartItems.map((i) => i.id);
  const menuItems = await sql`
    SELECT id FROM "MenuItem" WHERE id = ANY(${ids}::text[]) AND available = true
  `;
  if (menuItems.length !== cartItems.length) {
    return NextResponse.json({ error: 'Some items are unavailable' }, { status: 400 });
  }

  // Ensure schema columns exist
  await sql`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS notes TEXT`.catch(() => {});
  await sql`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS discount FLOAT NOT NULL DEFAULT 0`.catch(() => {});
  await sql`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promoCode" TEXT`.catch(() => {});
  await sql`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS tip FLOAT NOT NULL DEFAULT 0`.catch(() => {});
  await sql`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "guestEmail" TEXT`.catch(() => {});
  await sql`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "guestName" TEXT`.catch(() => {});
  await sql`ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL`.catch(() => {});

  const sub = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // Validate promo code from DB
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
      sql`UPDATE "PromoCode" SET "usedCount" = "usedCount" + 1 WHERE id = ${dbPromo.id}`.catch(() => {});
    }
  }

  const discountedSub = Math.max(0, sub - discount);
  const tax = Math.round(discountedSub * TAX_RATE * 100) / 100;
  const total = Math.round((discountedSub + tax + SERVICE_FEE + tipAmount) * 100) / 100;
  const orderId = uuidv4();

  // Stripe PaymentIntent if configured, otherwise mock
  let stripeId = `mock_${Date.now()}`;
  let clientSecret: string | null = null;

  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: 'usd',
        metadata: {
          orderId,
          userId: userId ?? 'guest',
          guestEmail: guestEmail ?? '',
        },
        description: `828 Grill order ${orderId.slice(-8).toUpperCase()}`,
      });
      stripeId = intent.id;
      clientSecret = intent.client_secret;
    } catch (err) {
      console.error('Stripe PaymentIntent error:', err);
    }
  }

  await sql`
    INSERT INTO "Order" (id, "userId", "guestEmail", "guestName", total, status, "stripeId", notes, discount, "promoCode", tip, "createdAt")
    VALUES (${orderId}, ${userId}, ${guestEmail}, ${guestName}, ${total}, 'pending', ${stripeId}, ${notes || null}, ${discount}, ${appliedPromo}, ${tipAmount}, NOW())
  `;

  for (const item of cartItems) {
    await sql`
      INSERT INTO "OrderItem" (id, "orderId", "menuItemId", quantity, "unitPrice")
      VALUES (${uuidv4()}, ${orderId}, ${item.id}, ${item.quantity}, ${item.price})
    `;
  }

  return NextResponse.json({
    order: { id: orderId, total, discount, tip: tipAmount, appliedPromo, status: 'pending', stripeId },
    session: { id: stripeId, clientSecret },
    stripeEnabled: !!clientSecret,
  });
}
