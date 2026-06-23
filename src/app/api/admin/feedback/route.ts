import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();

  const [summary, list] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int                                    AS total,
        ROUND(AVG("foodRating")::numeric, 2)::float      AS "avgFoodRating",
        ROUND(AVG("serviceRating")::numeric, 2)::float   AS "avgServiceRating",
        ROUND(AVG(("foodRating" + "serviceRating") / 2.0)::numeric, 2)::float AS "avgOverall",
        COUNT(*) FILTER (WHERE "foodRating" = 5)::int    AS "fiveStarFood",
        COUNT(*) FILTER (WHERE "serviceRating" = 5)::int AS "fiveStarService"
      FROM "Feedback"
    `,
    sql`
      SELECT
        f.id, f."orderId", f."foodRating", f."serviceRating", f.comment, f."createdAt",
        u.name AS "customerName", u.email AS "customerEmail",
        o.total AS "orderTotal"
      FROM "Feedback" f
      JOIN "User" u ON u.id = f."userId"
      JOIN "Order" o ON o.id = f."orderId"
      ORDER BY f."createdAt" DESC
      LIMIT 100
    `,
  ]);

  return NextResponse.json({ summary: summary[0] ?? {}, list });
}
