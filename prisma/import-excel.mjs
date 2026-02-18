import { PrismaClient } from "@prisma/client";
import XLSX from "xlsx";
import path from "path";

const prisma = new PrismaClient();

// Convert Excel serial date to JS Date
function excelDateToJSDate(serial) {
  // Excel epoch is 1900-01-01, but Excel thinks 1900 was a leap year (bug)
  // Day 1 = 1900-01-01
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400000);
}

// Safe number extraction
function num(val) {
  if (val === null || val === undefined || val === "" || String(val).includes("#REF")) return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

async function main() {
  const filePath = path.resolve("Отчет.xlsx");
  console.log(`Reading: ${filePath}`);

  const wb = XLSX.readFile(filePath);
  console.log(`Sheets: ${wb.SheetNames.join(", ")}`);

  for (const sheetName of wb.SheetNames) {
    console.log(`\nProcessing sheet: "${sheetName}"`);

    // Create or find location by sheet name
    let location = await prisma.location.findFirst({
      where: { name: sheetName },
    });

    if (!location) {
      location = await prisma.location.create({
        data: {
          name: sheetName,
          address: sheetName,
        },
      });
      console.log(`  Created location: ${sheetName} (${location.id})`);
    } else {
      console.log(`  Found location: ${sheetName} (${location.id})`);
    }

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    let imported = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 10) {
        skipped++;
        continue;
      }

      const firstCell = String(row[0] || "");
      const dateSerial = row[1];

      // Skip headers, month titles, totals, empty rows
      if (
        firstCell === "Дата" ||
        firstCell === "" ||
        firstCell === "итого" ||
        !dateSerial ||
        typeof dateSerial !== "number" ||
        dateSerial < 40000 // not a valid date serial
      ) {
        skipped++;
        continue;
      }

      const date = excelDateToJSDate(dateSerial);

      // Validate date is reasonable (2024-2027)
      const year = date.getFullYear();
      if (year < 2024 || year > 2027) {
        skipped++;
        continue;
      }

      // Convert order delivery time from fraction of day to minutes
      const deliveryTimeFraction = num(row[36]);
      const deliveryTimeMinutes = Math.round(deliveryTimeFraction * 24 * 60 * 100) / 100;

      const reportData = {
        locationId: location.id,
        date: date,

        // Sales (day)
        salesPlan: num(row[2]),
        salesFact: num(row[3]),
        discounts: num(row[4]),
        salesWithDiscounts: num(row[5]),
        discountPercent: num(row[6]),
        yandexFood: num(row[7]),
        salesDeviation: num(row[8]),

        // Sales (month cumulative)
        monthSalesPlan: num(row[9]),
        monthSalesFact: num(row[10]),
        monthSalesDeviation: num(row[11]),
        monthSalesDeviationRub: num(row[12]),

        // Orders
        ordersPlan: num(row[17]),
        ordersFact: Math.round(num(row[18])),
        ordersDeviation: num(row[19]),

        // Loyalty
        loyaltyPlan: num(row[20]),
        loyaltyFact: Math.round(num(row[21])),
        loyaltyPenetration: num(row[22]),
        loyaltyDeviation: num(row[23]),

        // Average check
        avgCheckPlan: num(row[24]),
        avgCheckFact: num(row[25]),
        avgCheckDeviation: num(row[26]),

        // Fill rate
        fillRatePlan: num(row[27]),
        fillRateFact: num(row[28]),
        avgDishes: num(row[30]),
        avgDrinks: num(row[31]),

        // Productivity
        portions: num(row[32]),
        productivityPlan: num(row[33]),
        hoursWorked: num(row[34]),
        productivityFact: num(row[35]),

        // Order delivery time (minutes)
        orderDeliveryTime: deliveryTimeMinutes,
      };

      try {
        await prisma.dailyReport.upsert({
          where: {
            locationId_date: {
              locationId: location.id,
              date: date,
            },
          },
          update: reportData,
          create: reportData,
        });
        imported++;
      } catch (err) {
        console.error(`  Error row ${i}: ${err.message}`);
      }
    }

    console.log(`  Imported: ${imported} rows, Skipped: ${skipped} rows`);
  }

  // Verify
  const totalReports = await prisma.dailyReport.count();
  const locations = await prisma.location.findMany();
  console.log(`\nDone! Total reports: ${totalReports}`);
  console.log(`Locations: ${locations.map((l) => l.name).join(", ")}`);

  // Show sample
  const sample = await prisma.dailyReport.findFirst({
    orderBy: { date: "desc" },
    include: { location: true },
  });
  if (sample) {
    console.log(`\nLatest report: ${sample.date.toISOString().split("T")[0]} - ${sample.location.name}`);
    console.log(`  Sales: plan=${sample.salesPlan}, fact=${sample.salesFact}`);
    console.log(`  Orders: plan=${sample.ordersPlan}, fact=${sample.ordersFact}`);
    console.log(`  Avg check: plan=${sample.avgCheckPlan}, fact=${sample.avgCheckFact}`);
    console.log(`  Delivery time: ${sample.orderDeliveryTime} min`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
