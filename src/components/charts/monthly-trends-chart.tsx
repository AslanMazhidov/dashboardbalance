"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface MonthlyTrendData {
  month: string;
  label: string;
  salesFact: number;
  salesPlan: number;
  ordersFact: number;
  avgCheckFact: number;
  productivityFact: number;
  orderDeliveryTime: number;
  count: number;
}

export type TrendMetric =
  | "salesFact"
  | "ordersFact"
  | "avgCheckFact";

const METRIC_CONFIG: Record<
  TrendMetric,
  {
    label: string;
    format: (v: number) => string;
    showPlan?: boolean;
  }
> = {
  salesFact: {
    label: "Продажи",
    format: (v) => formatCurrency(v),
    showPlan: true,
  },
  ordersFact: {
    label: "Заказы",
    format: (v) => Math.round(v).toLocaleString("ru-RU"),
  },
  avgCheckFact: {
    label: "Средний чек",
    format: (v) => formatCurrency(v),
  },
};

const COLORS = {
  primary: "#1B4332",
  plan: "#059669",
  accent: "#D97706",
};

function CustomTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string; dataKey: string }>;
  label?: string;
  metric: TrendMetric;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const config = METRIC_CONFIG[metric];

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">{config.format(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

interface MonthlyTrendsChartProps {
  data: MonthlyTrendData[];
  metric: TrendMetric;
  onMetricChange: (m: TrendMetric) => void;
}

export function MonthlyTrendsChart({
  data,
  metric,
  onMetricChange,
}: MonthlyTrendsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Тренды</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Нет данных</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = METRIC_CONFIG[metric];

  const tickFormatter =
    metric === "salesFact" || metric === "avgCheckFact"
      ? (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))
      : (v: number) => String(Math.round(v));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Тренды</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(METRIC_CONFIG) as TrendMetric[]).map((key) => (
              <button
                key={key}
                onClick={() => onMetricChange(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  metric === key
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {METRIC_CONFIG[key].label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fontWeight: 500 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={tickFormatter}
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Line
              type="monotone"
              dataKey={metric}
              name={config.label}
              stroke={COLORS.primary}
              strokeWidth={2.5}
              dot={{ r: 4, fill: COLORS.primary }}
              activeDot={{ r: 6 }}
            />
            {config.showPlan && (
              <Line
                type="monotone"
                dataKey="salesPlan"
                name="План"
                stroke={COLORS.plan}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: COLORS.plan }}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        {config.showPlan && (
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded" style={{ background: COLORS.primary }} />
              Факт
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4 rounded border-t-2 border-dashed" style={{ borderColor: COLORS.plan }} />
              План
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
