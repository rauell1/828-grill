import { NextResponse } from 'next/server';

// Neon Auth has been replaced with custom cookie-based auth.
// Routes are now handled by dedicated files:
//   POST /api/auth/register
//   POST /api/auth/login
//   POST /api/auth/logout
//   GET  /api/auth/session

export function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export function POST() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
