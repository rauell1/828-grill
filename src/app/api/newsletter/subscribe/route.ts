import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

async function ensureTable(sql: ReturnType<typeof getSql>) {
  await sql`
    CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      email       TEXT        NOT NULL UNIQUE,
      name        TEXT,
      "subscribedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = body.email?.trim().toLowerCase();
  const name  = body.name?.trim() || null;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
  }

  const sql = getSql();
  await ensureTable(sql);

  // Check if already subscribed in either table
  const [existingPublic] = await sql`
    SELECT id FROM "NewsletterSubscriber" WHERE email = ${email} LIMIT 1
  `;
  if (existingPublic) {
    return NextResponse.json({ message: 'Already subscribed!' });
  }

  await sql`
    INSERT INTO "NewsletterSubscriber" (email, name)
    VALUES (${email}, ${name})
    ON CONFLICT (email) DO NOTHING
  `;

  return NextResponse.json({ message: 'Subscribed successfully!' }, { status: 201 });
}
