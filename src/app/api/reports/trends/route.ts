import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    // Build location filter
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
        salesPlan: true,
        salesFact: true,
        discounts: true,
        salesWithDiscounts: true,
        discountPercent: true,
        yandexFood: true,
        ordersFact: true,
        avgCheckFact: true,
        loyaltyPenetration: true,
        productivityPlan: true,
        productivityFact: true,
        orderDeliveryTime: true,
      },
      orderBy: { date: "asc" },
    });

    // Aggregate by date (multiple locations may share the same date)
    const byDate = new Map<
      string,
      {
        salesPlan: number;
        salesFact: number;
        discounts: number;
        salesWithDiscounts: number;
        discountPercent: number;
        yandexFood: number;
        ordersFact: number;
        avgCheckFact: number;
        loyaltyPenetration: number;
        productivityPlan: number;
        productivityFact: number;
        orderDeliveryTime: number;
        count: number;
      }
    >();

    for (const r of reports) {
      const key = r.date.toISOString();
      const existing = byDate.get(key);
      if (existing) {
        existing.salesPlan += r.salesPlan;
        existing.salesFact += r.salesFact;
        existing.discounts += r.discounts;
        existing.salesWithDiscounts += r.salesWithDiscounts;
        existing.yandexFood += r.yandexFood;
        existing.ordersFact += r.ordersFact;
        // Weighted-average fields: accumulate, divide later
        existing.discountPercent += r.discountPercent;
        existing.avgCheckFact += r.avgCheckFact;
        existing.loyaltyPenetration += r.loyaltyPenetration;
        existing.productivityPlan += r.productivityPlan;
        existing.productivityFact += r.productivityFact;
        existing.orderDeliveryTime += r.orderDeliveryTime;
        existing.count += 1;
      } else {
        byDate.set(key, {
          salesPlan: r.salesPlan,
          salesFact: r.salesFact,
          discounts: r.discounts,
          salesWithDiscounts: r.salesWithDiscounts,
          discountPercent: r.discountPercent,
          yandexFood: r.yandexFood,
          ordersFact: r.ordersFact,
          avgCheckFact: r.avgCheckFact,
          loyaltyPenetration: r.loyaltyPenetration,
          productivityPlan: r.productivityPlan,
          productivityFact: r.productivityFact,
          orderDeliveryTime: r.orderDeliveryTime,
          count: 1,
        });
      }
    }

    const data = Array.from(byDate.entries()).map(([date, v]) => ({
      date,
      salesPlan: v.salesPlan,
      salesFact: v.salesFact,
      discounts: v.discounts,
      salesWithDiscounts: v.salesWithDiscounts,
      discountPercent: v.count > 1 ? v.discountPercent / v.count : v.discountPercent,
      yandexFood: v.yandexFood,
      ordersFact: v.ordersFact,
      avgCheckFact: v.count > 1 ? v.avgCheckFact / v.count : v.avgCheckFact,
      loyaltyPenetration: v.count > 1 ? v.loyaltyPenetration / v.count : v.loyaltyPenetration,
      productivityPlan: v.count > 1 ? v.productivityPlan / v.count : v.productivityPlan,
      productivityFact: v.count > 1 ? v.productivityFact / v.count : v.productivityFact,
      orderDeliveryTime: v.count > 1 ? v.orderDeliveryTime / v.count : v.orderDeliveryTime,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("GET /api/reports/trends error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
