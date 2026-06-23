import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSql } from '@/lib/db';
import { signToken, COOKIE_NAME, MAX_AGE } from '@/lib/session';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { allowed, retryAfterMs } = checkRateLimit(`login:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const sql = getSql();
  const rows = await sql`
    SELECT id, name, email, password FROM "User"
    WHERE email = ${email.toLowerCase().trim()} LIMIT 1
  `;

  const genericError = NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });

  if (!rows.length) return genericError;

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return genericError;

  // Clear rate limit on successful login
  resetRateLimit(`login:${ip}`);

  const token = signToken(user.id);
  const res = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
  return res;
}
