import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
// Reorder so Monday is index 0
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Пн, Вт, Ср, Чт, Пт, Сб, Вс

interface DayBucket {
  salesFact: number;
  salesPlan: number;
  ordersFact: number;
  discounts: number;
  yandexFood: number;
  avgCheckFact: number;
  productivityFact: number;
  orderDeliveryTime: number;
  loyaltyPenetration: number;
  count: number;
}

function emptyBucket(): DayBucket {
  return {
    salesFact: 0,
    salesPlan: 0,
    ordersFact: 0,
    discounts: 0,
    yandexFood: 0,
    avgCheckFact: 0,
    productivityFact: 0,
    orderDeliveryTime: 0,
    loyaltyPenetration: 0,
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
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 }
      );
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

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
        discounts: true,
        yandexFood: true,
        avgCheckFact: true,
        productivityFact: true,
        orderDeliveryTime: true,
        loyaltyPenetration: true,
      },
    });

    // Group by day of week (0=Sun ... 6=Sat)
    const buckets: DayBucket[] = Array.from({ length: 7 }, () => emptyBucket());

    for (const r of reports) {
      const dow = r.date.getUTCDay();
      const b = buckets[dow];
      b.salesFact += r.salesFact;
      b.salesPlan += r.salesPlan;
      b.ordersFact += r.ordersFact;
      b.discounts += r.discounts;
      b.yandexFood += r.yandexFood;
      b.avgCheckFact += r.avgCheckFact;
      b.productivityFact += r.productivityFact;
      b.orderDeliveryTime += r.orderDeliveryTime;
      b.loyaltyPenetration += r.loyaltyPenetration;
      b.count += 1;
    }

    const round = (v: number) => Math.round(v * 100) / 100;

    // Build result array ordered Mon–Sun
    const days = DAY_ORDER.map((dow) => {
      const b = buckets[dow];
      const c = b.count || 1;
      return {
        dayName: DAY_NAMES[dow],
        dayIndex: dow,
        count: b.count,
        salesFactTotal: round(b.salesFact),
        salesFactAvg: round(b.salesFact / c),
        salesPlanAvg: round(b.salesPlan / c),
        ordersFactTotal: Math.round(b.ordersFact),
        ordersFactAvg: round(b.ordersFact / c),
        discountsAvg: round(b.discounts / c),
        yandexFoodAvg: round(b.yandexFood / c),
        avgCheckFact: round(b.avgCheckFact / c),
        productivityFact: round(b.productivityFact / c),
        orderDeliveryTime: round(b.orderDeliveryTime / c),
        loyaltyPenetration: round(b.loyaltyPenetration / c),
      };
    });

    // Find best/worst by average sales
    let bestIdx = 0;
    let worstIdx = 0;
    for (let i = 1; i < days.length; i++) {
      if (days[i].salesFactAvg > days[bestIdx].salesFactAvg) bestIdx = i;
      if (days[i].count > 0 && days[i].salesFactAvg < days[worstIdx].salesFactAvg) worstIdx = i;
    }

    return NextResponse.json({
      days,
      bestDay: days[bestIdx],
      worstDay: days[worstIdx],
    });
  } catch (error) {
    console.error("GET /api/reports/weekday error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
