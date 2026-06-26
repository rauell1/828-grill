import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sql = getSql();

  const rows = await sql`SELECT * FROM "Report" WHERE id = ${id}`;
  if (rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sql = getSql();

  await sql`DELETE FROM "Report" WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
