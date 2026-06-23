import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

async function ensureTables(sql: ReturnType<typeof getSql>) {
  await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "newsletterSubscribed" BOOLEAN NOT NULL DEFAULT false`;
  await sql`
    CREATE TABLE IF NOT EXISTS "NewsletterCampaign" (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      subject     TEXT        NOT NULL,
      body        TEXT        NOT NULL,
      "sentAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "recipientCount" INTEGER NOT NULL DEFAULT 0
    )
  `;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();
  await ensureTables(sql);

  // Ensure public subscriber table exists too
  await sql`
    CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      "subscribedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const [regSubs, pubSubs, campaigns] = await Promise.all([
    sql`SELECT id, name, email FROM "User" WHERE "newsletterSubscribed" = true`,
    sql`SELECT id, name, email FROM "NewsletterSubscriber"`,
    sql`SELECT id, subject, "sentAt", "recipientCount" FROM "NewsletterCampaign" ORDER BY "sentAt" DESC LIMIT 30`,
  ]);

  // Merge and deduplicate by email
  const seen = new Set<string>();
  const subscribers = [...regSubs, ...pubSubs].filter((s) => {
    if (seen.has(s.email)) return false;
    seen.add(s.email);
    return true;
  }).sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));

  const configuredFrom = process.env.NEWSLETTER_FROM ?? null;

  return NextResponse.json({ subscribers, campaigns, configuredFrom });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subject, body } = await req.json();
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email service not configured. Add RESEND_API_KEY to environment variables.' },
      { status: 503 }
    );
  }

  const sql = getSql();
  await ensureTables(sql);

  // Merge registered + public subscribers, deduplicated by email
  const [regSubs2, pubSubs2] = await Promise.all([
    sql`SELECT name, email FROM "User" WHERE "newsletterSubscribed" = true`,
    sql`SELECT name, email FROM "NewsletterSubscriber"`,
  ]);
  const seen2 = new Set<string>();
  const subscribers = [...regSubs2, ...pubSubs2].filter((s: { email: string }) => {
    if (seen2.has(s.email)) return false;
    seen2.add(s.email);
    return true;
  }) as { name: string; email: string }[];

  if (!subscribers.length) {
    return NextResponse.json({ error: 'No subscribers yet' }, { status: 400 });
  }

  const FROM = `828 Grill <${process.env.NEWSLETTER_FROM ?? 'newsletters@828grill.com'}>`;
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Send in batches of 50 (Resend batch limit is 100)
  const BATCH = 50;
  let sent = 0;
  for (let i = 0; i < subscribers.length; i += BATCH) {
    const batch = subscribers.slice(i, i + BATCH).map((s) => ({
      from: FROM,
      to: s.email,
      subject,
      html: buildHtml(subject, body, s.name, s.email),
    }));
    const result = await resend.batch.send(batch);
    if (result.error) {
      return NextResponse.json(
        { error: `Resend error: ${result.error.message}`, from: FROM },
        { status: 502 }
      );
    }
    sent += batch.length;
  }

  await sql`
    INSERT INTO "NewsletterCampaign" (subject, body, "sentAt", "recipientCount")
    VALUES (${subject}, ${body}, NOW(), ${sent})
  `;

  return NextResponse.json({ sent });
}

function buildHtml(subject: string, body: string, name: string, email: string): string {
  const paragraphs = body
    .split('\n')
    .map((l) => `<p style="margin:0 0 14px;color:#cccccc;font-size:15px;line-height:1.7">${l || '&nbsp;'}</p>`)
    .join('');

  const siteBase = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://828-grill.vercel.app';
  const unsubscribeUrl = `${siteBase}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:48px 24px">
    <div style="text-align:center;margin-bottom:36px">
      <span style="display:inline-flex;align-items:center;gap:10px">
        <span style="display:inline-block;background:#e8531a;border-radius:10px;width:40px;height:40px;line-height:40px;text-align:center;font-size:20px">🔥</span>
        <span style="color:#f5f0e8;font-size:24px;font-weight:800;letter-spacing:3px">828 GRILL</span>
      </span>
    </div>
    <div style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px">
      <p style="margin:0 0 6px;color:#888;font-size:13px;text-transform:uppercase;letter-spacing:1px">Hey ${name || 'there'},</p>
      <h1 style="margin:0 0 28px;color:#f5f0e8;font-size:26px;font-weight:800;line-height:1.3">${subject}</h1>
      ${paragraphs}
      <div style="margin-top:32px;padding-top:28px;border-top:1px solid rgba(255,255,255,0.08);text-align:center">
        <a href="${siteBase}" style="display:inline-block;background:#e8531a;color:white;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase;padding:14px 32px;border-radius:10px">
          Order Now
        </a>
      </div>
    </div>
    <p style="margin:28px 0 0;text-align:center;color:#444;font-size:12px;line-height:1.6">
      828 Grill LLC · Asheville, NC 28801<br>
      You're receiving this because you subscribed to our newsletter.<br>
      <a href="${unsubscribeUrl}" style="color:#666;text-decoration:underline">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}
