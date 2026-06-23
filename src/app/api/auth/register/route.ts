import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getSql } from '@/lib/db';
import { signToken, COOKIE_NAME, MAX_AGE } from '@/lib/session';
import { checkRateLimit } from '@/lib/rate-limit';

const MAX_NAME = 100;
const MAX_PHONE = 30;
const MAX_ADDRESS = 300;

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { allowed, retryAfterMs } = checkRateLimit(`register:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { email, password, name, phone, address, newsletterSubscribed } = body;

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  if (name.trim().length > MAX_NAME) {
    return NextResponse.json({ error: `Name must be ${MAX_NAME} characters or fewer` }, { status: 400 });
  }
  if (phone && phone.trim().length > MAX_PHONE) {
    return NextResponse.json({ error: `Phone must be ${MAX_PHONE} characters or fewer` }, { status: 400 });
  }
  if (address && address.trim().length > MAX_ADDRESS) {
    return NextResponse.json({ error: `Address must be ${MAX_ADDRESS} characters or fewer` }, { status: 400 });
  }

  const sql = getSql();
  const normalEmail = email.toLowerCase().trim();

  const existing = await sql`SELECT id FROM "User" WHERE email = ${normalEmail} LIMIT 1`;
  if (existing.length) {
    // Don't reveal that the email is taken — return same 201 shape to prevent enumeration
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 }
    );
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
      ${phone?.trim().slice(0, MAX_PHONE) || null},
      ${address?.trim().slice(0, MAX_ADDRESS) || null},
      NOW(), NOW()
    )
    RETURNING id, name, email
  `;

  if (newsletterSubscribed) {
    try {
      await sql`UPDATE "User" SET "newsletterSubscribed" = true WHERE id = ${id}`;
    } catch { /* column not yet migrated */ }
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
