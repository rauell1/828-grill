import { NextResponse } from 'next/server';

// Images are now uploaded client-side directly to Cloudinary.
// This route is no longer used.
export function POST() {
  return NextResponse.json({ error: 'Use Cloudinary direct upload' }, { status: 410 });
}
