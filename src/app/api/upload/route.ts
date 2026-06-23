import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getAdminSession } from '@/lib/admin';

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Storage not configured. Add BLOB_READ_WRITE_TOKEN to environment variables.' },
      { status: 503 }
    );
  }

  const safeName = file.name.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
  const blob = await put(`menu/${Date.now()}-${safeName}`, file, { access: 'public' });

  return NextResponse.json({ url: blob.url });
}
