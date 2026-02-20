import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const MONTH_LABELS = [
  "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
  "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек",
];

interface MonthBucket {
  salesFact: number;
  salesPlan: number;
  ordersFact: number;
  avgCheckFact: number;
  productivityFact: number;
  orderDeliveryTime: number;
  count: number;
}

function emptyBucket(): MonthBucket {
  return {
    salesFact: 0,
    salesPlan: 0,
    ordersFact: 0,
    avgCheckFact: 0,
    productivityFact: 0,
    orderDeliveryTime: 0,
    count: 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");
    const dateFromParam = searchParams.get("dateFrom"); // YYYY-MM
    const dateToParam = searchParams.get("dateTo"); // YYYY-MM

    // Calculate date range
    const now = new Date();
    let from: Date;
    let to: Date;

    if (dateFromParam && dateToParam) {
      const [fy, fm] = dateFromParam.split("-").map(Number);
      const [ty, tm] = dateToParam.split("-").map(Number);
      from = new Date(fy, fm - 1, 1);
      to = new Date(ty, tm, 0); // last day of "to" month
    } else {
      const months = Math.min(Math.max(Number(searchParams.get("months")) || 3, 1), 24);
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      from = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    }

    const locationFilter: { locationId?: string } = {};
    if (locationId && locationId !== "all") {
      locationFilter.locationId = locationId;
    }

    const reports = await prisma.dailyReport.findMany({
      where: {
        ...locationFilter,
        date: { gte: from, lte: to },
      },
      select: {
        date: true,
        salesFact: true,
        salesPlan: true,
        ordersFact: true,
        avgCheckFact: true,
        productivityFact: true,
        orderDeliveryTime: true,
      },
      orderBy: { date: "asc" },
    });

    // Group by YYYY-MM
    const buckets = new Map<string, MonthBucket>();

    for (const r of reports) {
      const d = r.date;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const b = buckets.get(key) || emptyBucket();
      b.salesFact += r.salesFact;
      b.salesPlan += r.salesPlan;
      b.ordersFact += r.ordersFact;
      b.avgCheckFact += r.avgCheckFact;
      b.productivityFact += r.productivityFact;
      b.orderDeliveryTime += r.orderDeliveryTime;
      b.count += 1;
      buckets.set(key, b);
    }

    const round = (v: number) => Math.round(v * 100) / 100;

    // Build ordered array of months
    const data = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const b = buckets.get(key);
      const c = b?.count || 1;

      data.push({
        month: key,
        label: `${MONTH_LABELS[m]} ${y}`,
        salesFact: round(b?.salesFact ?? 0),
        salesPlan: round(b?.salesPlan ?? 0),
        ordersFact: Math.round(b?.ordersFact ?? 0),
        avgCheckFact: round((b?.avgCheckFact ?? 0) / c),
        productivityFact: round((b?.productivityFact ?? 0) / c),
        orderDeliveryTime: round((b?.orderDeliveryTime ?? 0) / c),
        count: b?.count ?? 0,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Calculate totals and comparison with previous period
    const totalSales = data.reduce((s, d) => s + d.salesFact, 0);
    const totalOrders = data.reduce((s, d) => s + d.ordersFact, 0);
    const daysWithData = data.reduce((s, d) => s + d.count, 0);
    const avgCheck = daysWithData > 0
      ? data.reduce((s, d) => s + d.avgCheckFact * d.count, 0) / daysWithData
      : 0;
    const avgProductivity = daysWithData > 0
      ? data.reduce((s, d) => s + d.productivityFact * d.count, 0) / daysWithData
      : 0;

    // Previous period for comparison (same duration as selected range)
    const rangeMonths = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
    const prevFrom = new Date(from);
    prevFrom.setMonth(prevFrom.getMonth() - rangeMonths);
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);

    const prevReports = await prisma.dailyReport.aggregate({
      where: {
        ...locationFilter,
        date: { gte: prevFrom, lte: prevTo },
      },
      _sum: { salesFact: true, ordersFact: true },
      _avg: { avgCheckFact: true, productivityFact: true },
    });

    return NextResponse.json({
      data,
      summary: {
        totalSales: round(totalSales),
        totalOrders,
        avgCheck: round(avgCheck),
        avgProductivity: round(avgProductivity),
      },
      previous: {
        totalSales: round(prevReports._sum.salesFact ?? 0),
        totalOrders: prevReports._sum.ordersFact ?? 0,
        avgCheck: round(prevReports._avg.avgCheckFact ?? 0),
        avgProductivity: round(prevReports._avg.productivityFact ?? 0),
      },
    });
  } catch (error) {
    console.error("GET /api/reports/monthly-trends error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
