export const REVENUE_CATEGORIES = [
  { value: "COFFEE", label: "Кофе" },
  { value: "FOOD", label: "Еда" },
  { value: "DRINKS", label: "Напитки" },
  { value: "OTHER", label: "Прочее" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "INGREDIENTS", label: "Ингредиенты" },
  { value: "RENT", label: "Аренда" },
  { value: "SALARY", label: "Зарплата" },
  { value: "UTILITIES", label: "Коммунальные" },
  { value: "MARKETING", label: "Маркетинг" },
  { value: "EQUIPMENT", label: "Оборудование" },
  { value: "OTHER", label: "Прочее" },
] as const;

export const PERIODS = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
] as const;

export type RevenueCategory = typeof REVENUE_CATEGORIES[number]["value"];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]["value"];
export type Period = typeof PERIODS[number]["value"];
