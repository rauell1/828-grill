import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '@/lib/session';
import { getSql } from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ user: null });

  const userId = verifyToken(token);
  if (!userId) return NextResponse.json({ user: null });

  const sql = getSql();
  const rows = await sql`SELECT id, name, email FROM "User" WHERE id = ${userId} LIMIT 1`;
  if (!rows.length) return NextResponse.json({ user: null });

  const u = rows[0];
  return NextResponse.json({ user: { id: u.id, name: u.name, email: u.email } });
}
