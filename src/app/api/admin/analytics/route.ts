import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();

  const [
    kpi, today, thisMonth, lastMonth,
    thisWeek, lastWeek,
    dailyRevenue, topProducts, worstProducts,
    categoryRevenue, topCustomers, statusBreakdown,
    deliveryTiming, topLocations, feedbackSummary,
    hourlyDistribution,
  ] = await Promise.all([
    // All-time KPIs
    sql`
      SELECT
        COALESCE(SUM(total), 0)::float            AS "totalRevenue",
        COUNT(*)::int                              AS "totalOrders",
        COALESCE(AVG(total), 0)::float             AS "avgOrderValue",
        COUNT(DISTINCT "userId")::int              AS "uniqueCustomers",
        COALESCE(SUM(total) * 0.08, 0)::float      AS "taxCollected",
        (COUNT(*) * 1.5)::float                    AS "feesCollected"
      FROM "Order"
      WHERE status IN ('confirmed','paid','preparing','ready','delivered')
    `,

    // Today
    sql`
      SELECT
        COALESCE(SUM(total), 0)::float AS revenue,
        COUNT(*)::int                  AS orders
      FROM "Order"
      WHERE status IN ('confirmed','paid','preparing','ready','delivered')
        AND "createdAt"::date = CURRENT_DATE
    `,

    // This month
    sql`
      SELECT COALESCE(SUM(total), 0)::float AS revenue, COUNT(*)::int AS orders
      FROM "Order"
      WHERE status IN ('confirmed','paid','preparing','ready','delivered')
        AND DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())
    `,

    // Last month
    sql`
      SELECT COALESCE(SUM(total), 0)::float AS revenue, COUNT(*)::int AS orders
      FROM "Order"
      WHERE status IN ('confirmed','paid','preparing','ready','delivered')
        AND DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
    `,

    // This week (Mon–today)
    sql`
      SELECT COALESCE(SUM(total), 0)::float AS revenue, COUNT(*)::int AS orders
      FROM "Order"
      WHERE status IN ('confirmed','paid','preparing','ready','delivered')
        AND "createdAt" >= DATE_TRUNC('week', NOW())
    `,

    // Last week
    sql`
      SELECT COALESCE(SUM(total), 0)::float AS revenue, COUNT(*)::int AS orders
      FROM "Order"
      WHERE status IN ('confirmed','paid','preparing','ready','delivered')
        AND "createdAt" >= DATE_TRUNC('week', NOW() - INTERVAL '1 week')
        AND "createdAt" < DATE_TRUNC('week', NOW())
    `,

    // Daily revenue — last 30 days
    sql`
      SELECT
        "createdAt"::date                AS date,
        COALESCE(SUM(total), 0)::float   AS revenue,
        COUNT(*)::int                    AS orders
      FROM "Order"
      WHERE status IN ('confirmed','paid','preparing','ready','delivered')
        AND "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY "createdAt"::date
      ORDER BY date
    `,

    // Top 10 products by revenue
    sql`
      SELECT
        m.name, m.category,
        SUM(oi.quantity)::int                        AS "unitsSold",
        SUM(oi.quantity * oi."unitPrice")::float     AS revenue
      FROM "OrderItem" oi
      JOIN "MenuItem" m ON m.id = oi."menuItemId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status IN ('confirmed','paid','preparing','ready','delivered')
      GROUP BY m.id, m.name, m.category
      ORDER BY revenue DESC
      LIMIT 10
    `,

    // Worst 5 products
    sql`
      SELECT
        m.name, m.category,
        COALESCE(SUM(oi.quantity), 0)::int                         AS "unitsSold",
        COALESCE(SUM(oi.quantity * oi."unitPrice"), 0)::float      AS revenue
      FROM "MenuItem" m
      LEFT JOIN "OrderItem" oi ON oi."menuItemId" = m.id
      LEFT JOIN "Order" o ON o.id = oi."orderId"
        AND o.status IN ('confirmed','paid','preparing','ready','delivered')
      WHERE m.available = true
      GROUP BY m.id, m.name, m.category
      ORDER BY "unitsSold" ASC
      LIMIT 5
    `,

    // Revenue by category
    sql`
      SELECT
        m.category,
        SUM(oi.quantity * oi."unitPrice")::float   AS revenue,
        SUM(oi.quantity)::int                      AS units,
        COUNT(DISTINCT o.id)::int                  AS "orderCount"
      FROM "OrderItem" oi
      JOIN "MenuItem" m ON m.id = oi."menuItemId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status IN ('confirmed','paid','preparing','ready','delivered')
      GROUP BY m.category
      ORDER BY revenue DESC
    `,

    // Top 10 customers
    sql`
      SELECT
        u.name, u.email, u.phone,
        COUNT(o.id)::int              AS "orderCount",
        SUM(o.total)::float           AS "totalSpent",
        MAX(o."createdAt")            AS "lastOrder",
        ROUND(AVG(f."foodRating")::numeric, 1)::float     AS "avgFoodRating",
        ROUND(AVG(f."serviceRating")::numeric, 1)::float  AS "avgServiceRating"
      FROM "Order" o
      JOIN "User" u ON u.id = o."userId"
      LEFT JOIN "Feedback" f ON f."userId" = o."userId"
      WHERE o.status IN ('confirmed','paid','preparing','ready','delivered')
      GROUP BY u.id, u.name, u.email, u.phone
      ORDER BY "totalSpent" DESC
      LIMIT 20
    `,

    // Status breakdown
    sql`
      SELECT status, COUNT(*)::int AS count
      FROM "Order"
      GROUP BY status
      ORDER BY count DESC
    `,

    // Delivery timing (avg minutes between status transitions)
    sql`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM ("preparingAt" - "createdAt")) / 60)::numeric, 1)::float AS "avgMinsToPrep",
        ROUND(AVG(EXTRACT(EPOCH FROM ("readyAt" - "preparingAt")) / 60)::numeric, 1)::float   AS "avgMinsToCook",
        ROUND(AVG(EXTRACT(EPOCH FROM ("deliveredAt" - "createdAt")) / 60)::numeric, 1)::float AS "avgMinsTotalTime",
        COUNT(*) FILTER (WHERE "deliveredAt" IS NOT NULL)::int AS "deliveredCount"
      FROM "Order"
      WHERE status = 'delivered'
        AND "preparingAt" IS NOT NULL
    `,

    // Top delivery locations (by customer address)
    sql`
      SELECT
        COALESCE(u.address, 'Unknown') AS location,
        COUNT(o.id)::int               AS "orderCount",
        SUM(o.total)::float            AS revenue
      FROM "Order" o
      JOIN "User" u ON u.id = o."userId"
      WHERE o.status IN ('confirmed','paid','preparing','ready','delivered')
        AND u.address IS NOT NULL
        AND u.address != ''
      GROUP BY u.address
      ORDER BY "orderCount" DESC
      LIMIT 15
    `,

    // Feedback summary
    sql`
      SELECT
        COUNT(*)::int                                    AS total,
        ROUND(AVG("foodRating")::numeric, 2)::float      AS "avgFoodRating",
        ROUND(AVG("serviceRating")::numeric, 2)::float   AS "avgServiceRating",
        ROUND(AVG(("foodRating" + "serviceRating") / 2.0)::numeric, 2)::float AS "avgOverall",
        COUNT(*) FILTER (WHERE "foodRating" >= 4)::int    AS "positiveFoodCount",
        COUNT(*) FILTER (WHERE "serviceRating" >= 4)::int AS "positiveServiceCount"
      FROM "Feedback"
    `,

    // Orders by hour of day (for peak hours)
    sql`
      SELECT
        EXTRACT(HOUR FROM "createdAt")::int AS hour,
        COUNT(*)::int                       AS orders
      FROM "Order"
      WHERE status IN ('confirmed','paid','preparing','ready','delivered')
      GROUP BY hour
      ORDER BY hour
    `,
  ]);

  return NextResponse.json({
    kpi: kpi[0] ?? {},
    today: today[0] ?? {},
    thisMonth: thisMonth[0] ?? {},
    lastMonth: lastMonth[0] ?? {},
    thisWeek: thisWeek[0] ?? {},
    lastWeek: lastWeek[0] ?? {},
    dailyRevenue,
    topProducts,
    worstProducts,
    categoryRevenue,
    topCustomers,
    statusBreakdown,
    deliveryTiming: deliveryTiming[0] ?? {},
    topLocations,
    feedbackSummary: feedbackSummary[0] ?? {},
    hourlyDistribution,
  });
}
