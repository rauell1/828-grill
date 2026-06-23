import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase().trim();

  if (!email) {
    return new Response('Missing email parameter.', { status: 400, headers: { 'Content-Type': 'text/plain' } });
  }

  const sql = getSql();

  await Promise.all([
    sql`DELETE FROM "NewsletterSubscriber" WHERE email = ${email}`.catch(() => {}),
    sql`UPDATE "User" SET "newsletterSubscribed" = false WHERE email = ${email}`.catch(() => {}),
  ]);

  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Unsubscribed</title>
    <style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#f5f0e8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
    .box{text-align:center;padding:2rem;max-width:420px}h1{color:#e8531a;margin-bottom:.5rem}p{color:#888;font-size:.9rem}</style></head>
    <body><div class="box"><h1>828 GRILL</h1><p style="color:#f5f0e8;font-size:1.1rem;margin-bottom:.5rem">You've been unsubscribed.</p>
    <p>${email} has been removed from our list. You won't receive any more marketing emails from us.</p></div></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
