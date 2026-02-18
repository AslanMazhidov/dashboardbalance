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

    // Calculate the previous period with the same duration
    const durationMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - durationMs);
    const prevTo = new Date(from.getTime());

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
      date: { gte: prevFrom, lt: prevTo },
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
          ordersFact: true,
        },
      }),
      prisma.dailyReport.aggregate({
        where: wherePreviousPeriod,
        _avg: {
          avgCheckFact: true,
        },
      }),
    ]);

    const salesFact = currentAgg._sum.salesFact || 0;
    const salesPlan = currentAgg._sum.salesPlan || 0;
    const ordersFact = currentAgg._sum.ordersFact || 0;
    const ordersPlan = currentAgg._sum.ordersPlan || 0;

    const avgCheckFact = currentAvg._avg.avgCheckFact || 0;
    const avgCheckPlan = currentAvg._avg.avgCheckPlan || 0;
    const loyaltyPenetrationAvg = currentAvg._avg.loyaltyPenetration || 0;
    const productivityAvg = currentAvg._avg.productivityFact || 0;
    const orderTimeAvg = currentAvg._avg.orderDeliveryTime || 0;

    // Calculate deviations
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
    const prevOrdersFact = prevAgg._sum.ordersFact || 0;
    const prevAvgCheckFact = prevAvg._avg.avgCheckFact || 0;

    // Calculate percentage changes compared to previous period
    const salesChange =
      prevSalesFact > 0
        ? ((salesFact - prevSalesFact) / prevSalesFact) * 100
        : 0;
    const ordersChange =
      prevOrdersFact > 0
        ? ((ordersFact - prevOrdersFact) / prevOrdersFact) * 100
        : 0;
    const avgCheckChange =
      prevAvgCheckFact > 0
        ? ((avgCheckFact - prevAvgCheckFact) / prevAvgCheckFact) * 100
        : 0;

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
      salesChange: round(salesChange),
      ordersChange: round(ordersChange),
      avgCheckChange: round(avgCheckChange),
    });
  } catch (error) {
    console.error("GET /api/reports/summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
