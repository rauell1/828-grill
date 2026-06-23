import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/lib/auth/server';
import { getSql } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { allowed, retryAfterMs } = checkRateLimit(`resend-verify:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${Math.ceil(retryAfterMs / 60000)} minute(s).` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) } }
    );
  }

  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();
  const token = uuidv4();

  const rows = await sql`
    UPDATE "User"
    SET "verifyToken" = ${token}
    WHERE id = ${session.user.id} AND "emailVerified" = false
    RETURNING name, email
  `;

  if (!rows.length) {
    return NextResponse.json({ message: 'Already verified or user not found' });
  }

  await sendVerificationEmail(rows[0].email, rows[0].name, token);
  return NextResponse.json({ message: 'Verification email sent' });
}
