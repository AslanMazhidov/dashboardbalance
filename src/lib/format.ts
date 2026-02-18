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
 * Format minutes as h:mm.
 * Example: 191 -> "3:11", 45 -> "0:45"
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}
