import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getSql } from '@/lib/db';

const PAID = `('confirmed','paid','preparing','ready','delivered')`;

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sql = getSql();

  const [kpi, today, thisMonth, lastMonth, dailyRevenue, topProducts, worstProducts, categoryRevenue, topCustomers, statusBreakdown] =
    await Promise.all([
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
          COALESCE(SUM(total), 0)::float AS "revenue",
          COUNT(*)::int                  AS "orders"
        FROM "Order"
        WHERE status IN ('confirmed','paid','preparing','ready','delivered')
          AND "createdAt"::date = CURRENT_DATE
      `,

      // This month
      sql`
        SELECT COALESCE(SUM(total), 0)::float AS "revenue", COUNT(*)::int AS "orders"
        FROM "Order"
        WHERE status IN ('confirmed','paid','preparing','ready','delivered')
          AND DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW())
      `,

      // Last month (for growth comparison)
      sql`
        SELECT COALESCE(SUM(total), 0)::float AS "revenue", COUNT(*)::int AS "orders"
        FROM "Order"
        WHERE status IN ('confirmed','paid','preparing','ready','delivered')
          AND DATE_TRUNC('month', "createdAt") = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
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
          m.name,
          m.category,
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

      // Worst 5 products (available items with fewest sales)
      sql`
        SELECT
          m.name,
          m.category,
          COALESCE(SUM(oi.quantity), 0)::int           AS "unitsSold",
          COALESCE(SUM(oi.quantity * oi."unitPrice"), 0)::float AS revenue
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
          u.name,
          u.email,
          COUNT(o.id)::int              AS "orderCount",
          SUM(o.total)::float           AS "totalSpent",
          MAX(o."createdAt")            AS "lastOrder"
        FROM "Order" o
        JOIN "User" u ON u.id = o."userId"
        WHERE o.status IN ('confirmed','paid','preparing','ready','delivered')
        GROUP BY u.id, u.name, u.email
        ORDER BY "totalSpent" DESC
        LIMIT 10
      `,

      // Status breakdown (all orders)
      sql`
        SELECT status, COUNT(*)::int AS count
        FROM "Order"
        GROUP BY status
        ORDER BY count DESC
      `,
    ]);

  return NextResponse.json({
    kpi: kpi[0] ?? {},
    today: today[0] ?? {},
    thisMonth: thisMonth[0] ?? {},
    lastMonth: lastMonth[0] ?? {},
    dailyRevenue,
    topProducts,
    worstProducts,
    categoryRevenue,
    topCustomers,
    statusBreakdown,
  });
}
