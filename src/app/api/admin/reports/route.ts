import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';
import { v4 as uuid } from 'uuid';

async function ensureTable(sql: ReturnType<typeof getSql>) {
  await sql`
    CREATE TABLE IF NOT EXISTS "Report" (
      id              TEXT        PRIMARY KEY,
      title           TEXT        NOT NULL,
      "generatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "generatedBy"   TEXT,
      "fileData"      TEXT        NOT NULL,
      "fileSizeBytes" INT,
      "snapshotJson"  JSONB
    )
  `;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();
  await ensureTable(sql);

  const rows = await sql`
    SELECT id, title, "generatedAt", "generatedBy", "fileSizeBytes", "snapshotJson"
    FROM "Report"
    ORDER BY "generatedAt" DESC
    LIMIT 50
  `;

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, fileData, snapshotJson } = body as {
    title: string;
    fileData: string;        // base64-encoded PDF
    snapshotJson?: object;
  };

  if (!title || !fileData) {
    return NextResponse.json({ error: 'title and fileData are required' }, { status: 400 });
  }

  const sql = getSql();
  await ensureTable(sql);

  const id = uuid();
  const fileSizeBytes = Math.round((fileData.length * 3) / 4);

  await sql`
    INSERT INTO "Report" (id, title, "generatedBy", "fileData", "fileSizeBytes", "snapshotJson")
    VALUES (
      ${id},
      ${title},
      ${session.email ?? null},
      ${fileData},
      ${fileSizeBytes},
      ${snapshotJson ? JSON.stringify(snapshotJson) : null}
    )
  `;

  return NextResponse.json({ id, fileSizeBytes });
}
