import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

/**
 * Format a number as Russian rubles with space as thousands separator.
 * Example: 12500 -> "12 500 ₽"
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} ₽`;
}

/**
 * Format a number as a percentage with sign.
 * Example: 12.34 -> "+12.3%", -5.67 -> "-5.7%"
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Format a date to "DD.MM.YYYY" format using Russian locale.
 * Accepts both Date objects and ISO date strings.
 * Example: new Date(2024, 0, 15) -> "15.01.2024"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd.MM.yyyy", { locale: ru });
}

/**
 * Short date for chart axis labels.
 * Example: "2024-01-15T00:00:00.000Z" -> "15 янв"
 */
export function formatShortDate(date: string): string {
  return format(parseISO(date), "d MMM", { locale: ru });
}

/**
 * Format seconds as mm:ss.
 * Example: 191 -> "3:11", 1640 -> "27:20"
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
