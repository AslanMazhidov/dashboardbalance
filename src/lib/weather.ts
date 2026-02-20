import { prisma } from "@/lib/db";

// Сочи по умолчанию
const WEATHER_LAT = process.env.WEATHER_LAT || "43.5855";
const WEATHER_LON = process.env.WEATHER_LON || "39.7231";

export interface WeatherDayData {
  date: string; // "YYYY-MM-DD"
  tempMin: number;
  tempMax: number;
  tempMean: number;
  precipitation: number;
  weatherCode: number;
}

export interface WeatherInfo {
  icon: string;
  label: string;
}

/** WMO Weather Code → иконка + подпись */
export function getWeatherInfo(code: number): WeatherInfo {
  if (code === 0) return { icon: "☀️", label: "Ясно" };
  if (code <= 3) return { icon: "⛅", label: "Облачно" };
  if (code <= 48) return { icon: "🌫️", label: "Туман" };
  if (code <= 67) return { icon: "🌧️", label: "Дождь" };
  if (code <= 77) return { icon: "🌨️", label: "Снег" };
  if (code <= 82) return { icon: "🌧️", label: "Ливень" };
  if (code <= 86) return { icon: "🌨️", label: "Снегопад" };
  if (code <= 99) return { icon: "⛈️", label: "Гроза" };
  return { icon: "❓", label: "Неизвестно" };
}

/**
 * Получить погоду за диапазон дат.
 * Cache-first: сначала БД, потом дозапрашиваем Open-Meteo.
 */
export async function getWeatherForRange(
  dateFrom: Date,
  dateTo: Date,
): Promise<WeatherDayData[]> {
  // 1. Что уже есть в кеше
  const cached = await prisma.weatherDay.findMany({
    where: { date: { gte: dateFrom, lte: dateTo } },
    orderBy: { date: "asc" },
  });

  const cachedDates = new Set(
    cached.map((w) => w.date.toISOString().slice(0, 10)),
  );

  // 2. Собираем все даты диапазона
  const allDates: string[] = [];
  const cursor = new Date(dateFrom);
  while (cursor <= dateTo) {
    allDates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const missingDates = allDates.filter(
    (d) => !cachedDates.has(d) && d < today,
  );

  // 3. Дозапрашиваем отсутствующие
  if (missingDates.length > 0) {
    const fetchFrom = missingDates[0];
    const fetchTo = missingDates[missingDates.length - 1];

    try {
      const url =
        `https://archive-api.open-meteo.com/v1/archive` +
        `?latitude=${WEATHER_LAT}&longitude=${WEATHER_LON}` +
        `&start_date=${fetchFrom}&end_date=${fetchTo}` +
        `&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,weathercode` +
        `&timezone=Europe/Moscow`;

      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        const daily = json.daily;

        const records = [];
        for (let i = 0; i < daily.time.length; i++) {
          if (!cachedDates.has(daily.time[i])) {
            records.push({
              date: new Date(daily.time[i] + "T00:00:00.000Z"),
              tempMin: daily.temperature_2m_min[i] ?? 0,
              tempMax: daily.temperature_2m_max[i] ?? 0,
              tempMean: daily.temperature_2m_mean[i] ?? 0,
              precipitation: daily.precipitation_sum[i] ?? 0,
              weatherCode: daily.weathercode[i] ?? 0,
            });
          }
        }

        if (records.length > 0) {
          await prisma.$transaction(
            records.map((r) =>
              prisma.weatherDay.upsert({
                where: { date: r.date },
                create: r,
                update: {},
              }),
            ),
          );
        }
      }
    } catch (error) {
      console.error("Failed to fetch weather from Open-Meteo:", error);
    }
  }

  // 4. Возвращаем всё из БД
  const result = await prisma.weatherDay.findMany({
    where: { date: { gte: dateFrom, lte: dateTo } },
    orderBy: { date: "asc" },
  });

  return result.map((w) => ({
    date: w.date.toISOString().slice(0, 10),
    tempMin: w.tempMin,
    tempMax: w.tempMax,
    tempMean: w.tempMean,
    precipitation: w.precipitation,
    weatherCode: w.weatherCode,
  }));
}
