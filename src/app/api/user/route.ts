import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();
  const users = await sql`
    SELECT id, name, email, phone, address, "createdAt"
    FROM "User" WHERE email = ${session.user.email} LIMIT 1
  `;
  if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user: users[0] });
}

export async function PUT(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, phone, address } = body;
  const sql = getSql();

  const users = await sql`
    UPDATE "User"
    SET
      name = COALESCE(${name ? String(name).trim() : null}, name),
      phone = ${phone ? String(phone).trim() : null},
      address = ${address ? String(address).trim() : null},
      "updatedAt" = NOW()
    WHERE email = ${session.user.email}
    RETURNING id, name, email, phone, address
  `;

  return NextResponse.json({ user: users[0] });
}
