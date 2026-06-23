import { NextResponse } from 'next/server';
import { isOpen, getTodayHours, formatHoursDisplay } from '@/lib/hours';

export async function GET() {
  return NextResponse.json(
    { isOpen: isOpen(), today: getTodayHours(), allHours: formatHoursDisplay() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
