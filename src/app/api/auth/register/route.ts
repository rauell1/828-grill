import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getSql } from '@/lib/db';
import { signToken, COOKIE_NAME, MAX_AGE } from '@/lib/session';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { email, password, name, phone, address, newsletterSubscribed } = body;

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const sql = getSql();
  const normalEmail = email.toLowerCase().trim();

  const existing = await sql`SELECT id FROM "User" WHERE email = ${normalEmail} LIMIT 1`;
  if (existing.length) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const id = uuidv4();

  const rows = await sql`
    INSERT INTO "User" (id, name, email, password, phone, address, "createdAt", "updatedAt")
    VALUES (
      ${id},
      ${name.trim()},
      ${normalEmail},
      ${hashed},
      ${phone?.trim() || null},
      ${address?.trim() || null},
      NOW(), NOW()
    )
    RETURNING id, name, email
  `;

  // Opt-in to newsletter — column added lazily; ignore if not yet migrated
  if (newsletterSubscribed) {
    try {
      await sql`UPDATE "User" SET "newsletterSubscribed" = true WHERE id = ${id}`;
    } catch { /* column not yet migrated — safe to skip */ }
  }

  const user = rows[0];
  const token = signToken(user.id);

  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
  return res;
}
