import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token')?.trim();

  if (!token) {
    return new Response(htmlPage('Invalid Link', 'Missing verification token.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const sql = getSql();
  const rows = await sql`
    UPDATE "User"
    SET "emailVerified" = true, "verifyToken" = null
    WHERE "verifyToken" = ${token} AND "emailVerified" = false
    RETURNING id
  `;

  if (!rows.length) {
    return new Response(
      htmlPage('Link Expired', 'This verification link is invalid or has already been used.', false),
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  return new Response(
    htmlPage('Email Verified', 'Your email has been verified. You can now close this tab and return to 828 Grill.', true),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}

function htmlPage(heading: string, message: string, success: boolean) {
  const color = success ? '#22c55e' : '#e8531a';
  const icon = success ? '✓' : '✗';
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${heading} — 828 Grill</title>
<style>body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#f5f0e8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:2rem;max-width:420px}.icon{font-size:3rem;color:${color}}.title{color:${color};font-size:1.5rem;font-weight:800;margin:.5rem 0}
p{color:#888;font-size:.9rem;line-height:1.6}a{color:#e8531a;text-decoration:underline}</style></head>
<body><div class="box"><div class="icon">${icon}</div><p class="title">${heading}</p>
<p>${message}</p><p style="margin-top:1.5rem"><a href="/">← Back to 828 Grill</a></p></div></body></html>`;
}
