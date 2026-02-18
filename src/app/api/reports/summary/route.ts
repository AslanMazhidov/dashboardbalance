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
    const compareFrom = searchParams.get("compareFrom");
    const compareTo = searchParams.get("compareTo");

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "dateFrom and dateTo are required" },
        { status: 400 }
      );
    }

    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    // Comparison period: use explicit params or auto-calculate previous period
    let prevFrom: Date;
    let prevTo: Date;
    if (compareFrom && compareTo) {
      prevFrom = new Date(compareFrom);
      prevTo = new Date(compareTo);
    } else {
      const durationMs = to.getTime() - from.getTime();
      prevFrom = new Date(from.getTime() - durationMs);
      prevTo = new Date(from.getTime());
    }

    // Build location filter
    const locationFilter: { locationId?: string } = {};
    if (locationId && locationId !== "all") {
      locationFilter.locationId = locationId;
    }

    const whereCurrentPeriod = {
      ...locationFilter,
      date: { gte: from, lte: to },
    };

    const wherePreviousPeriod = {
      ...locationFilter,
      date: { gte: prevFrom, lte: prevTo },
    };

    // Fetch current and previous period aggregates in parallel
    const [currentAgg, currentAvg, prevAgg, prevAvg] = await Promise.all([
      prisma.dailyReport.aggregate({
        where: whereCurrentPeriod,
        _sum: {
          salesFact: true,
          salesPlan: true,
          ordersFact: true,
          ordersPlan: true,
          discounts: true,
          yandexFood: true,
        },
      }),
      prisma.dailyReport.aggregate({
        where: whereCurrentPeriod,
        _avg: {
          avgCheckFact: true,
          avgCheckPlan: true,
          loyaltyPenetration: true,
          productivityFact: true,
          orderDeliveryTime: true,
        },
      }),
      prisma.dailyReport.aggregate({
        where: wherePreviousPeriod,
        _sum: {
          salesFact: true,
          salesPlan: true,
          ordersFact: true,
          discounts: true,
          yandexFood: true,
        },
      }),
      prisma.dailyReport.aggregate({
        where: wherePreviousPeriod,
        _avg: {
          avgCheckFact: true,
          loyaltyPenetration: true,
          productivityFact: true,
          orderDeliveryTime: true,
        },
      }),
    ]);

    // Current period values
    const salesFact = currentAgg._sum.salesFact || 0;
    const salesPlan = currentAgg._sum.salesPlan || 0;
    const ordersFact = currentAgg._sum.ordersFact || 0;
    const ordersPlan = currentAgg._sum.ordersPlan || 0;
    const discountsTotal = currentAgg._sum.discounts || 0;
    const yandexFoodTotal = currentAgg._sum.yandexFood || 0;

    const avgCheckFact = currentAvg._avg.avgCheckFact || 0;
    const avgCheckPlan = currentAvg._avg.avgCheckPlan || 0;
    const loyaltyPenetrationAvg = currentAvg._avg.loyaltyPenetration || 0;
    const productivityAvg = currentAvg._avg.productivityFact || 0;
    const orderTimeAvg = currentAvg._avg.orderDeliveryTime || 0;

    // Deviations (plan vs fact)
    const salesDeviation =
      salesPlan > 0 ? ((salesFact - salesPlan) / salesPlan) * 100 : 0;
    const ordersDeviation =
      ordersPlan > 0 ? ((ordersFact - ordersPlan) / ordersPlan) * 100 : 0;
    const avgCheckDeviation =
      avgCheckPlan > 0
        ? ((avgCheckFact - avgCheckPlan) / avgCheckPlan) * 100
        : 0;

    // Previous period values
    const prevSalesFact = prevAgg._sum.salesFact || 0;
    const prevSalesPlan = prevAgg._sum.salesPlan || 0;
    const prevOrdersFact = prevAgg._sum.ordersFact || 0;
    const prevDiscounts = prevAgg._sum.discounts || 0;
    const prevYandexFood = prevAgg._sum.yandexFood || 0;
    const prevAvgCheckFact = prevAvg._avg.avgCheckFact || 0;
    const prevLoyalty = prevAvg._avg.loyaltyPenetration || 0;
    const prevProductivity = prevAvg._avg.productivityFact || 0;
    const prevOrderTime = prevAvg._avg.orderDeliveryTime || 0;

    // Percentage change helper
    const pctChange = (curr: number, prev: number) =>
      prev > 0 ? ((curr - prev) / prev) * 100 : 0;

    const salesChange = pctChange(salesFact, prevSalesFact);
    const salesPlanChange = pctChange(salesPlan, prevSalesPlan);
    const ordersChange = pctChange(ordersFact, prevOrdersFact);
    const avgCheckChange = pctChange(avgCheckFact, prevAvgCheckFact);
    const discountsChange = pctChange(discountsTotal, prevDiscounts);
    const yandexFoodChange = pctChange(yandexFoodTotal, prevYandexFood);
    const loyaltyChange = pctChange(loyaltyPenetrationAvg, prevLoyalty);
    const productivityChange = pctChange(productivityAvg, prevProductivity);
    const orderTimeChange = pctChange(orderTimeAvg, prevOrderTime);

    const round = (v: number) => Math.round(v * 100) / 100;

    return NextResponse.json({
      salesFact: round(salesFact),
      salesPlan: round(salesPlan),
      salesDeviation: round(salesDeviation),
      ordersFact,
      ordersPlan: round(ordersPlan),
      ordersDeviation: round(ordersDeviation),
      avgCheckFact: round(avgCheckFact),
      avgCheckPlan: round(avgCheckPlan),
      avgCheckDeviation: round(avgCheckDeviation),
      loyaltyPenetrationAvg: round(loyaltyPenetrationAvg),
      productivityAvg: round(productivityAvg),
      orderTimeAvg: round(orderTimeAvg),
      discountsTotal: round(discountsTotal),
      yandexFoodTotal: round(yandexFoodTotal),
      // All change metrics
      salesChange: round(salesChange),
      salesPlanChange: round(salesPlanChange),
      ordersChange: round(ordersChange),
      avgCheckChange: round(avgCheckChange),
      discountsChange: round(discountsChange),
      yandexFoodChange: round(yandexFoodChange),
      loyaltyChange: round(loyaltyChange),
      productivityChange: round(productivityChange),
      orderTimeChange: round(orderTimeChange),
    });
  } catch (error) {
    console.error("GET /api/reports/summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
