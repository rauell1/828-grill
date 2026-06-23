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

  const sql = getSql();
  const ids = cartItems.map((i) => i.id);
  const menuItems = await sql`
    SELECT id FROM "MenuItem" WHERE id = ANY(${ids}::text[]) AND available = true
  `;
  if (menuItems.length !== cartItems.length) {
    return NextResponse.json({ error: 'Some items are unavailable' }, { status: 400 });
  }

  const users = await sql`SELECT id FROM "User" WHERE email = ${session.user.email} LIMIT 1`;
  if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const userId = users[0].id;

  const sub = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(sub * TAX_RATE * 100) / 100;
  const total = Math.round((sub + tax + SERVICE_FEE) * 100) / 100;
  const orderId = uuidv4();
  const stripeId = `mock_${Date.now()}`;

  await sql`
    INSERT INTO "Order" (id, "userId", total, status, "stripeId", "createdAt")
    VALUES (${orderId}, ${userId}, ${total}, 'pending', ${stripeId}, NOW())
  `;

  for (const item of cartItems) {
    await sql`
      INSERT INTO "OrderItem" (id, "orderId", "menuItemId", quantity, "unitPrice")
      VALUES (${uuidv4()}, ${orderId}, ${item.id}, ${item.quantity}, ${item.price})
    `;
  }

  return NextResponse.json({
    order: { id: orderId, total, status: 'pending', stripeId },
    session: { id: stripeId },
  });
}
