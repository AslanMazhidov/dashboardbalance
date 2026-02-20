"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
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

  // Deduplicate: Area and Line share the same dataKey — keep the Line entry
  // (last occurrence) which carries the friendly `name` prop.
  const byKey = new Map<string, (typeof payload)[number]>();
  for (const entry of payload) {
    byKey.set(entry.dataKey, entry);
  }
  const unique = Array.from(byKey.values());

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{label}</p>
      {unique.map((entry, index) => (
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

  // Calculate Y-axis domain with padding so small differences are visible
  const allValues = data.flatMap((d) => {
    const vals = [d[metric] as number];
    if (config.showPlan) vals.push(d.salesPlan);
    return vals;
  }).filter((v) => v > 0);

  let yMin = 0;
  let yMax = "auto" as number | "auto";

  if (allValues.length > 0) {
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    const padding = range > 0 ? range * 0.15 : max * 0.1;
    yMin = Math.max(0, Math.floor(min - padding));
    yMax = Math.ceil(max + padding);
  }

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
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="gradPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.15} />
                <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradPlan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.plan} stopOpacity={0.1} />
                <stop offset="100%" stopColor={COLORS.plan} stopOpacity={0.01} />
              </linearGradient>
            </defs>
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
              domain={[yMin, yMax]}
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Area
              type="monotone"
              dataKey={metric}
              fill="url(#gradPrimary)"
              stroke="none"
              tooltipType="none"
            />
            {config.showPlan && (
              <Area
                type="monotone"
                dataKey="salesPlan"
                fill="url(#gradPlan)"
                stroke="none"
                tooltipType="none"
              />
            )}
            <Line
              type="monotone"
              dataKey={metric}
              name={config.label}
              stroke={COLORS.primary}
              strokeWidth={2.5}
              dot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
            />
            {config.showPlan && (
              <Line
                type="monotone"
                dataKey="salesPlan"
                name="План"
                stroke={COLORS.plan}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: COLORS.plan, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 5 }}
              />
            )}
          </ComposedChart>
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
