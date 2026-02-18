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

    const data = reports.map((report) => ({
      date: report.date.toISOString(),
      salesPlan: report.salesPlan,
      salesFact: report.salesFact,
      discounts: report.discounts,
      salesWithDiscounts: report.salesWithDiscounts,
      discountPercent: report.discountPercent,
      yandexFood: report.yandexFood,
      ordersFact: report.ordersFact,
      avgCheckFact: report.avgCheckFact,
      loyaltyPenetration: report.loyaltyPenetration,
      productivityPlan: report.productivityPlan,
      productivityFact: report.productivityFact,
      orderDeliveryTime: report.orderDeliveryTime,
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
