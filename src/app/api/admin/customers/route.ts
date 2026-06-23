import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();

  const [summary, customers] = await Promise.all([
    sql`
      SELECT
        COUNT(DISTINCT u.id)::int            AS "totalCustomers",
        COUNT(DISTINCT u.id) FILTER (
          WHERE u."createdAt" >= DATE_TRUNC('month', NOW())
        )::int                               AS "newThisMonth",
        COUNT(DISTINCT u.id) FILTER (
          WHERE u."createdAt" >= DATE_TRUNC('week', NOW())
        )::int                               AS "newThisWeek"
      FROM "User" u
    `,
    sql`
      SELECT
        u.id, u.name, u.email, u.phone, u.address,
        u."createdAt" AS "joinedAt", u."emailVerified",
        COUNT(o.id)::int                                           AS "orderCount",
        COALESCE(SUM(o.total), 0)::float                           AS "totalSpent",
        MAX(o."createdAt")                                         AS "lastOrderAt",
        ROUND(AVG(f."foodRating")::numeric, 1)::float              AS "avgFoodRating",
        ROUND(AVG(f."serviceRating")::numeric, 1)::float           AS "avgServiceRating",
        COUNT(f.id)::int                                           AS "feedbackCount"
      FROM "User" u
      LEFT JOIN "Order" o ON o."userId" = u.id
        AND o.status IN ('confirmed','paid','preparing','ready','delivered')
      LEFT JOIN "Feedback" f ON f."userId" = u.id
      GROUP BY u.id, u.name, u.email, u.phone, u.address, u."createdAt", u."emailVerified"
      ORDER BY "totalSpent" DESC, u."createdAt" DESC
      LIMIT 200
    `,
  ]);

  return NextResponse.json({ summary: summary[0] ?? {}, customers });
}
