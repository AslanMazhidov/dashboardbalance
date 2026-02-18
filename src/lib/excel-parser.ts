import * as XLSX from "xlsx";

/** Convert Excel serial date number to a JS Date (UTC) */
export function excelDateToJSDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400000);
}

/** Safe number extraction — returns 0 for nulls, #REF errors, NaN */
export function num(val: unknown): number {
  if (
    val === null ||
    val === undefined ||
    val === "" ||
    String(val).includes("#REF")
  )
    return 0;
  const n = Number(val);
  return isNaN(n) ? 0 : n;
}

/**
 * Read delivery time from the formatted cell text (e.g. "3:11" → 191 seconds).
 * Falls back to raw value if formatted text is unavailable.
 */
function readDeliveryTime(
  ws: XLSX.WorkSheet,
  wsRow: number,
  col: number,
): number {
  if (col < 0) return 0;
  const addr = XLSX.utils.encode_cell({ r: wsRow, c: col });
  const cell = ws[addr];
  if (!cell) return 0;

  // Try formatted text first (e.g. "3:11", "27:20")
  const text = (cell.w || "").trim();
  const match = text.match(/^(\d{1,3}):(\d{2})$/);
  if (match) {
    return Number(match[1]) * 60 + Number(match[2]);
  }

  // Fallback: raw value — if < 1 treat as Excel day-fraction, else as seconds
  const raw = num(cell.v);
  if (raw > 0 && raw < 1) return Math.round(raw * 86400);
  return Math.round(raw);
}

export interface ParsedRow {
  sheetName: string;
  date: Date;
  salesPlan: number;
  salesFact: number;
  discounts: number;
  salesWithDiscounts: number;
  discountPercent: number;
  yandexFood: number;
  salesDeviation: number;
  monthSalesPlan: number;
  monthSalesFact: number;
  monthSalesDeviation: number;
  monthSalesDeviationRub: number;
  ordersPlan: number;
  ordersFact: number;
  ordersDeviation: number;
  loyaltyPlan: number;
  loyaltyFact: number;
  loyaltyPenetration: number;
  loyaltyDeviation: number;
  avgCheckPlan: number;
  avgCheckFact: number;
  avgCheckDeviation: number;
  fillRatePlan: number;
  fillRateFact: number;
  avgDishes: number;
  avgDrinks: number;
  portions: number;
  productivityPlan: number;
  hoursWorked: number;
  productivityFact: number;
  orderDeliveryTime: number;
}

export interface SheetResult {
  sheetName: string;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ParseResult {
  sheets: SheetResult[];
  totalImported: number;
  totalSkipped: number;
  totalErrors: number;
  sheetNames: string[];
}

/** Section column positions detected from the header row */
interface SectionColumns {
  sales: number;
  orders: number;
  loyalty: number;
  avgCheck: number;
  fillRate: number;
  productivity: number;
  deliveryTime: number;
}

/**
 * Detect section start columns from the header row (Row 0).
 * Matches known Russian section names to column positions.
 */
function detectSections(headerRow: unknown[]): SectionColumns {
  const result: SectionColumns = {
    sales: -1,
    orders: -1,
    loyalty: -1,
    avgCheck: -1,
    fillRate: -1,
    productivity: -1,
    deliveryTime: -1,
  };

  for (let c = 0; c < headerRow.length; c++) {
    const val = String(headerRow[c] || "").trim().toLowerCase();
    if (!val) continue;

    // Check "время выдачи" BEFORE "заказ" to avoid false match
    // ("время выдачи заказа" contains "заказ")
    if (val === "продажи") result.sales = c;
    else if (val.includes("время выдачи")) result.deliveryTime = c;
    else if (val.includes("заказ")) result.orders = c;
    else if (val.includes("лояльност")) result.loyalty = c;
    else if (val.includes("средний чек")) result.avgCheck = c;
    else if (val.includes("наполненность")) result.fillRate = c;
    else if (val.includes("производительность")) result.productivity = c;
  }

  return result;
}

/**
 * Find the actual start of productivity data columns.
 * The "Производительность" merged header may overlap with the last
 * sub-column of "Наполненность" (e.g. "Порции"). We scan the sub-header
 * row to find "план" which marks the real productivity plan column.
 */
function findProductivityDataStart(
  rows: unknown[][],
  headerIdx: number,
  sectionCol: number
): number {
  if (sectionCol < 0) return -1;

  const subRow = rows[headerIdx + 1];
  if (!subRow) return sectionCol;

  for (
    let c = sectionCol;
    c < Math.min(sectionCol + 5, subRow.length);
    c++
  ) {
    const val = String(subRow[c] || "").trim().toLowerCase();
    if (val.includes("план")) return c;
  }

  return sectionCol;
}

/**
 * Parse an Excel workbook buffer and return structured data per sheet.
 * Dynamically detects column positions from header row text,
 * so it works with files that have different column layouts.
 */
export function parseExcelBuffer(buffer: Buffer): {
  sheetNames: string[];
  rowsBySheet: Map<string, ParsedRow[]>;
  skippedBySheet: Map<string, number>;
} {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const rowsBySheet = new Map<string, ParsedRow[]>();
  const skippedBySheet = new Map<string, number>();

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];
    const parsed: ParsedRow[] = [];
    let skipped = 0;
    const wsRange = XLSX.utils.decode_range(ws["!ref"] || "A1");

    // 1. Find header row (the one with "Дата" in col 0)
    let headerIdx = -1;
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      if (String(rows[i]?.[0] || "").trim() === "Дата") {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) {
      skippedBySheet.set(sheetName, rows.length);
      rowsBySheet.set(sheetName, []);
      continue;
    }

    // 2. Detect section positions from header row
    const sec = detectSections(rows[headerIdx] as unknown[]);

    // 3. Resolve productivity data start (may differ from header position)
    const pStart = findProductivityDataStart(rows, headerIdx, sec.productivity);

    // 4. Parse data rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 10) {
        skipped++;
        continue;
      }

      const firstCell = String(row[0] || "").trim();
      const dateSerial = row[1];

      if (
        firstCell === "Дата" ||
        firstCell === "" ||
        firstCell.toLowerCase() === "итого" ||
        !dateSerial ||
        typeof dateSerial !== "number" ||
        dateSerial < 40000
      ) {
        skipped++;
        continue;
      }

      const date = excelDateToJSDate(dateSerial);
      const year = date.getFullYear();
      if (year < 2024 || year > 2027) {
        skipped++;
        continue;
      }

      // Section shortcuts
      const s = sec.sales;
      const o = sec.orders;
      const l = sec.loyalty;
      const ch = sec.avgCheck;
      const n = sec.fillRate;
      const p = pStart;
      const dt = sec.deliveryTime;

      parsed.push({
        sheetName,
        date,
        // Продажи (11 sub-columns from section start)
        salesPlan: s >= 0 ? num(row[s]) : 0,
        salesFact: s >= 0 ? num(row[s + 1]) : 0,
        discounts: s >= 0 ? num(row[s + 2]) : 0,
        salesWithDiscounts: s >= 0 ? num(row[s + 3]) : 0,
        discountPercent: s >= 0 ? num(row[s + 4]) : 0,
        yandexFood: s >= 0 ? num(row[s + 5]) : 0,
        salesDeviation: s >= 0 ? num(row[s + 6]) : 0,
        monthSalesPlan: s >= 0 ? num(row[s + 7]) : 0,
        monthSalesFact: s >= 0 ? num(row[s + 8]) : 0,
        monthSalesDeviation: s >= 0 ? num(row[s + 9]) : 0,
        monthSalesDeviationRub: s >= 0 ? num(row[s + 10]) : 0,
        // Кол-во заказов (3 sub-columns)
        ordersPlan: o >= 0 ? num(row[o]) : 0,
        ordersFact: o >= 0 ? Math.round(num(row[o + 1])) : 0,
        ordersDeviation: o >= 0 ? num(row[o + 2]) : 0,
        // Карты лояльности (4 sub-columns)
        loyaltyPlan: l >= 0 ? num(row[l]) : 0,
        loyaltyFact: l >= 0 ? Math.round(num(row[l + 1])) : 0,
        loyaltyPenetration: l >= 0 ? num(row[l + 2]) : 0,
        loyaltyDeviation: l >= 0 ? num(row[l + 3]) : 0,
        // Средний чек (3 sub-columns)
        avgCheckPlan: ch >= 0 ? num(row[ch]) : 0,
        avgCheckFact: ch >= 0 ? num(row[ch + 1]) : 0,
        avgCheckDeviation: ch >= 0 ? num(row[ch + 2]) : 0,
        // Наполненность (6 sub-columns: plan, fact, deviation, dishes, drinks, portions)
        fillRatePlan: n >= 0 ? num(row[n]) : 0,
        fillRateFact: n >= 0 ? num(row[n + 1]) : 0,
        avgDishes: n >= 0 ? num(row[n + 3]) : 0,
        avgDrinks: n >= 0 ? num(row[n + 4]) : 0,
        portions: n >= 0 ? num(row[n + 5]) : 0,
        // Производительность (3 sub-columns from resolved start)
        productivityPlan: p >= 0 ? num(row[p]) : 0,
        hoursWorked: p >= 0 ? num(row[p + 1]) : 0,
        productivityFact: p >= 0 ? num(row[p + 2]) : 0,
        // Время выдачи заказа: читаем форматированный текст ячейки (мм:сс → секунды)
        orderDeliveryTime: readDeliveryTime(ws, wsRange.s.r + i, dt),
      });
    }

    rowsBySheet.set(sheetName, parsed);
    skippedBySheet.set(sheetName, skipped);
  }

  return { sheetNames: wb.SheetNames, rowsBySheet, skippedBySheet };
}
