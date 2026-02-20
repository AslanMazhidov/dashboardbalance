import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeatherForRange, getWeatherInfo } from "@/lib/weather";
import { getHolidayMap } from "@/lib/holidays";

const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

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

    const now = new Date();
    let from: Date;
    let to: Date;

    if (dateFromParam && dateToParam) {
      const [fy, fm] = dateFromParam.split("-").map(Number);
      const [ty, tm] = dateToParam.split("-").map(Number);
      from = new Date(fy, fm - 1, 1);
      to = new Date(ty, tm, 0); // last day of "to" month
    } else {
      to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const locationFilter: { locationId?: string } = {};
    if (locationId && locationId !== "all") {
      locationFilter.locationId = locationId;
    }

    // Параллельно запрашиваем отчёты и погоду
    const [reports, weather] = await Promise.all([
      prisma.dailyReport.findMany({
        where: { ...locationFilter, date: { gte: from, lte: to } },
        select: {
          date: true,
          salesFact: true,
          ordersFact: true,
          avgCheckFact: true,
          salesPlan: true,
        },
        orderBy: { date: "asc" },
      }),
      getWeatherForRange(from, to),
    ]);

    const weatherMap = new Map(weather.map((w) => [w.date, w]));
    const holidayMap = getHolidayMap();

    // Агрегируем по дате (если несколько локаций)
    const dateAgg = new Map<
      string,
      {
        salesFact: number;
        ordersFact: number;
        avgCheckSum: number;
        salesPlan: number;
        count: number;
      }
    >();

    for (const r of reports) {
      const dateStr = r.date.toISOString().slice(0, 10);
      const existing = dateAgg.get(dateStr);
      if (existing) {
        existing.salesFact += r.salesFact;
        existing.ordersFact += r.ordersFact;
        existing.avgCheckSum += r.avgCheckFact;
        existing.salesPlan += r.salesPlan;
        existing.count += 1;
      } else {
        dateAgg.set(dateStr, {
          salesFact: r.salesFact,
          ordersFact: r.ordersFact,
          avgCheckSum: r.avgCheckFact,
          salesPlan: r.salesPlan,
          count: 1,
        });
      }
    }

    // Собираем массив дней
    const days = [];
    const cursor = new Date(from);
    while (cursor <= to) {
      const dateStr = cursor.toISOString().slice(0, 10);
      const monthDay = dateStr.slice(5); // "MM-DD"
      const agg = dateAgg.get(dateStr);
      const w = weatherMap.get(dateStr);
      const holiday = holidayMap.get(monthDay);
      const dayOfWeek = cursor.getUTCDay();

      days.push({
        date: dateStr,
        dayOfWeek: DAY_NAMES[dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        salesFact: agg ? Math.round(agg.salesFact * 100) / 100 : null,
        ordersFact: agg ? agg.ordersFact : null,
        avgCheck:
          agg && agg.count > 0
            ? Math.round((agg.avgCheckSum / agg.count) * 100) / 100
            : null,
        salesPlan: agg ? Math.round(agg.salesPlan * 100) / 100 : null,
        tempMin: w?.tempMin ?? null,
        tempMax: w?.tempMax ?? null,
        tempMean: w?.tempMean ?? null,
        precipitation: w?.precipitation ?? null,
        weatherCode: w?.weatherCode ?? null,
        weatherIcon: w ? getWeatherInfo(w.weatherCode).icon : null,
        weatherLabel: w ? getWeatherInfo(w.weatherCode).label : null,
        holidayName: holiday?.name ?? null,
        holidayType: holiday?.type ?? null,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    // Статистика
    const withSales = days.filter(
      (d) => d.salesFact !== null && d.salesFact > 0,
    );

    const holidayDays = withSales.filter((d) => d.holidayName !== null);
    const regularDays = withSales.filter((d) => d.holidayName === null);
    const avgSalesHoliday =
      holidayDays.length > 0
        ? holidayDays.reduce((s, d) => s + (d.salesFact ?? 0), 0) /
          holidayDays.length
        : 0;
    const avgSalesRegular =
      regularDays.length > 0
        ? regularDays.reduce((s, d) => s + (d.salesFact ?? 0), 0) /
          regularDays.length
        : 0;

    const rainyDays = withSales.filter(
      (d) => d.precipitation !== null && d.precipitation > 1,
    );
    const dryDays = withSales.filter(
      (d) => d.precipitation !== null && d.precipitation <= 1,
    );
    const avgSalesRainy =
      rainyDays.length > 0
        ? rainyDays.reduce((s, d) => s + (d.salesFact ?? 0), 0) /
          rainyDays.length
        : 0;
    const avgSalesDry =
      dryDays.length > 0
        ? dryDays.reduce((s, d) => s + (d.salesFact ?? 0), 0) / dryDays.length
        : 0;

    const coldDays = withSales.filter(
      (d) => d.tempMean !== null && d.tempMean < 0,
    );
    const coolDays = withSales.filter(
      (d) => d.tempMean !== null && d.tempMean >= 0 && d.tempMean <= 15,
    );
    const warmDays = withSales.filter(
      (d) => d.tempMean !== null && d.tempMean > 15,
    );

    const avg = (arr: typeof withSales) =>
      arr.length > 0
        ? Math.round(
            (arr.reduce((s, d) => s + (d.salesFact ?? 0), 0) / arr.length) *
              100,
          ) / 100
        : 0;

    const round = (v: number) => Math.round(v * 100) / 100;

    return NextResponse.json({
      days,
      summary: {
        holidayAvg: round(avgSalesHoliday),
        regularAvg: round(avgSalesRegular),
        holidayCount: holidayDays.length,
        regularCount: regularDays.length,
        rainyAvg: round(avgSalesRainy),
        dryAvg: round(avgSalesDry),
        rainyCount: rainyDays.length,
        dryCount: dryDays.length,
        temperature: {
          cold: { avg: avg(coldDays), count: coldDays.length, label: "< 0°C" },
          cool: {
            avg: avg(coolDays),
            count: coolDays.length,
            label: "0–15°C",
          },
          warm: {
            avg: avg(warmDays),
            count: warmDays.length,
            label: "> 15°C",
          },
        },
      },
    });
  } catch (error) {
    console.error("GET /api/reports/factors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
