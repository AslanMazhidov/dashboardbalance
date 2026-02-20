export interface Holiday {
  month: number; // 1-12
  day: number;
  name: string;
  type: "public" | "notable";
}

const HOLIDAYS: Holiday[] = [
  // Новогодние каникулы
  { month: 1, day: 1, name: "Новый год", type: "public" },
  { month: 1, day: 2, name: "Новогодние каникулы", type: "public" },
  { month: 1, day: 3, name: "Новогодние каникулы", type: "public" },
  { month: 1, day: 4, name: "Новогодние каникулы", type: "public" },
  { month: 1, day: 5, name: "Новогодние каникулы", type: "public" },
  { month: 1, day: 6, name: "Новогодние каникулы", type: "public" },
  { month: 1, day: 7, name: "Рождество Христово", type: "public" },
  { month: 1, day: 8, name: "Новогодние каникулы", type: "public" },
  // Заметные даты
  { month: 2, day: 14, name: "День Св. Валентина", type: "notable" },
  { month: 2, day: 23, name: "День защитника Отечества", type: "public" },
  { month: 3, day: 8, name: "Международный женский день", type: "public" },
  { month: 5, day: 1, name: "Праздник Весны и Труда", type: "public" },
  { month: 5, day: 9, name: "День Победы", type: "public" },
  { month: 6, day: 12, name: "День России", type: "public" },
  { month: 9, day: 1, name: "День знаний", type: "notable" },
  { month: 11, day: 4, name: "День народного единства", type: "public" },
  { month: 12, day: 31, name: "Канун Нового года", type: "notable" },
];

/** Map of "MM-DD" → Holiday for O(1) lookup */
export function getHolidayMap(): Map<string, Holiday> {
  const map = new Map<string, Holiday>();
  for (const h of HOLIDAYS) {
    const key = `${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`;
    map.set(key, h);
  }
  return map;
}
