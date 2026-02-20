"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FactorsDayData {
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  salesFact: number | null;
  ordersFact: number | null;
  avgCheck: number | null;
  salesPlan: number | null;
  tempMin: number | null;
  tempMax: number | null;
  tempMean: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  weatherIcon: string | null;
  weatherLabel: string | null;
  holidayName: string | null;
  holidayType: string | null;
}

const COLORS = {
  sales: "#1B4332",
  precipitation: "#93C5FD",
  holiday: "#F59E0B",
};

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getUTCDate();
  const months = [
    "янв", "фев", "мар", "апр", "май", "июн",
    "июл", "авг", "сен", "окт", "ноя", "дек",
  ];
  return `${day} ${months[d.getUTCMonth()]}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: Array<any>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0]?.payload as FactorsDayData | undefined;
  if (!row) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 text-sm font-medium text-muted-foreground">
        {row.dayOfWeek}, {formatDateLabel(row.date)}
      </p>
      {row.holidayName && (
        <p className="mb-2 text-xs font-medium text-amber-600">
          {row.holidayName}
        </p>
      )}
      {row.salesFact !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: COLORS.sales }}
          />
          <span className="text-muted-foreground">Продажи:</span>
          <span className="font-medium">{formatCurrency(row.salesFact)}</span>
        </div>
      )}
      {row.avgCheck !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-stone-400" />
          <span className="text-muted-foreground">Ср. чек:</span>
          <span className="font-medium">{formatCurrency(row.avgCheck)}</span>
        </div>
      )}
      {row.weatherIcon && (
        <div className="flex items-center gap-2 text-sm">
          <span className="inline-block w-2.5 text-center">
            {row.weatherIcon}
          </span>
          <span className="text-muted-foreground">
            {row.weatherLabel}, {row.tempMean?.toFixed(1)}°C
          </span>
        </div>
      )}
      {row.precipitation !== null && row.precipitation > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: COLORS.precipitation }}
          />
          <span className="text-muted-foreground">Осадки:</span>
          <span className="font-medium">{row.precipitation.toFixed(1)} мм</span>
        </div>
      )}
    </div>
  );
}

interface FactorsChartProps {
  data: FactorsDayData[];
}

export function FactorsChart({ data }: FactorsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Выручка и факторы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Нет данных</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Y-axis domain for sales
  const salesValues = data
    .map((d) => d.salesFact)
    .filter((v): v is number => v !== null && v > 0);

  let yMin = 0;
  let yMax: number | "auto" = "auto";

  if (salesValues.length > 0) {
    const min = Math.min(...salesValues);
    const max = Math.max(...salesValues);
    const range = max - min;
    const padding = range > 0 ? range * 0.15 : max * 0.1;
    yMin = Math.max(0, Math.floor(min - padding));
    yMax = Math.ceil(max + padding);
  }

  // Holiday dates for reference lines
  const holidays = data.filter((d) => d.holidayName !== null);

  // Calculate interval for X-axis labels
  const interval = data.length > 60 ? 13 : data.length > 30 ? 6 : 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Выручка и факторы</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={COLORS.sales}
                  stopOpacity={0.15}
                />
                <stop
                  offset="100%"
                  stopColor={COLORS.sales}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fontWeight: 500 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDateLabel}
              interval={interval}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
              domain={[yMin, yMax]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v} мм`}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Holiday reference lines */}
            {holidays.map((h) => (
              <ReferenceLine
                key={h.date}
                x={h.date}
                yAxisId="left"
                stroke={COLORS.holiday}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            ))}

            {/* Precipitation bars */}
            <Bar
              yAxisId="right"
              dataKey="precipitation"
              fill={COLORS.precipitation}
              opacity={0.5}
              radius={[2, 2, 0, 0]}
              name="Осадки"
            />

            {/* Sales area + line */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="salesFact"
              fill="url(#gradSales)"
              stroke="none"
              tooltipType="none"
              connectNulls
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="salesFact"
              name="Продажи"
              stroke={COLORS.sales}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded"
              style={{ background: COLORS.sales }}
            />
            Продажи
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: COLORS.precipitation, opacity: 0.5 }}
            />
            Осадки
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed"
              style={{ borderColor: COLORS.holiday }}
            />
            Праздник
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
