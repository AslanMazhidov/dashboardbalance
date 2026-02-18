import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  parseExcelBuffer,
  type ParseResult,
  type SheetResult,
} from "@/lib/excel-parser";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "OWNER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не найден" },
        { status: 400 }
      );
    }

    if (
      !file.name.endsWith(".xlsx") &&
      !file.name.endsWith(".xls")
    ) {
      return NextResponse.json(
        { error: "Файл должен быть в формате Excel (.xlsx)" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Файл слишком большой (макс. 10 МБ)" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { sheetNames, rowsBySheet, skippedBySheet } =
      parseExcelBuffer(buffer);

    // Create import batch
    const userId = session.user.id as string;
    const batch = await prisma.importBatch.create({
      data: {
        fileName: file.name,
        userId,
      },
    });

    const results: SheetResult[] = [];

    for (const sheetName of sheetNames) {
      const rows = rowsBySheet.get(sheetName) || [];
      const skipped = skippedBySheet.get(sheetName) || 0;
      const errors: string[] = [];
      let imported = 0;

      let location = await prisma.location.findFirst({
        where: { name: sheetName },
      });

      if (!location) {
        location = await prisma.location.create({
          data: { name: sheetName, address: sheetName },
        });
      }

      for (const row of rows) {
        const reportData = {
          locationId: location.id,
          date: row.date,
          salesPlan: row.salesPlan,
          salesFact: row.salesFact,
          discounts: row.discounts,
          salesWithDiscounts: row.salesWithDiscounts,
          discountPercent: row.discountPercent,
          yandexFood: row.yandexFood,
          salesDeviation: row.salesDeviation,
          monthSalesPlan: row.monthSalesPlan,
          monthSalesFact: row.monthSalesFact,
          monthSalesDeviation: row.monthSalesDeviation,
          monthSalesDeviationRub: row.monthSalesDeviationRub,
          ordersPlan: row.ordersPlan,
          ordersFact: row.ordersFact,
          ordersDeviation: row.ordersDeviation,
          loyaltyPlan: row.loyaltyPlan,
          loyaltyFact: row.loyaltyFact,
          loyaltyPenetration: row.loyaltyPenetration,
          loyaltyDeviation: row.loyaltyDeviation,
          avgCheckPlan: row.avgCheckPlan,
          avgCheckFact: row.avgCheckFact,
          avgCheckDeviation: row.avgCheckDeviation,
          fillRatePlan: row.fillRatePlan,
          fillRateFact: row.fillRateFact,
          avgDishes: row.avgDishes,
          avgDrinks: row.avgDrinks,
          portions: row.portions,
          productivityPlan: row.productivityPlan,
          hoursWorked: row.hoursWorked,
          productivityFact: row.productivityFact,
          orderDeliveryTime: row.orderDeliveryTime,
          importBatchId: batch.id,
        };

        try {
          await prisma.dailyReport.upsert({
            where: {
              locationId_date: {
                locationId: location.id,
                date: row.date,
              },
            },
            update: reportData,
            create: reportData,
          });
          imported++;
        } catch (err) {
          errors.push(
            `${row.date.toISOString().split("T")[0]}: ${(err as Error).message}`
          );
        }
      }

      results.push({ sheetName, imported, skipped, errors });
    }

    const totalImported = results.reduce((s, r) => s + r.imported, 0);

    // Update batch with final count
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { recordCount: totalImported },
    });

    const response: ParseResult = {
      sheets: results,
      totalImported,
      totalSkipped: results.reduce((s, r) => s + r.skipped, 0),
      totalErrors: results.reduce((s, r) => s + r.errors.length, 0),
      sheetNames,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("POST /api/import error:", error);
    return NextResponse.json(
      { error: "Ошибка при обработке файла" },
      { status: 500 }
    );
  }
}
