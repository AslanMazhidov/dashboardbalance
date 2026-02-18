"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { formatCurrency, formatDuration } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface WeekdayData {
  dayName: string;
  dayIndex: number;
  count: number;
  salesFactAvg: number;
  salesPlanAvg: number;
  ordersFactAvg: number;
  discountsAvg: number;
  yandexFoodAvg: number;
  avgCheckFact: number;
  productivityFact: number;
  orderDeliveryTime: number;
  loyaltyPenetration: number;
}

export type WeekdayMetric =
  | "salesFactAvg"
  | "ordersFactAvg"
  | "avgCheckFact"
  | "productivityFact"
  | "orderDeliveryTime";

const METRIC_CONFIG: Record<
  WeekdayMetric,
  { label: string; format: (v: number) => string; unit?: string }
> = {
  salesFactAvg: {
    label: "Средние продажи",
    format: (v) => formatCurrency(v),
  },
  ordersFactAvg: {
    label: "Среднее кол-во заказов",
    format: (v) => Math.round(v).toLocaleString("ru-RU"),
  },
  avgCheckFact: {
    label: "Средний чек",
    format: (v) => formatCurrency(v),
  },
  productivityFact: {
    label: "Производительность",
    format: (v) => formatCurrency(v),
    unit: "₽/час",
  },
  orderDeliveryTime: {
    label: "Время выдачи",
    format: (v) => formatDuration(v),
  },
};

interface WeekdayChartProps {
  data: WeekdayData[];
  metric: WeekdayMetric;
  onMetricChange: (m: WeekdayMetric) => void;
}

function CustomTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
  metric: WeekdayMetric;
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

const COLORS = {
  default: "#1B4332",
  best: "#059669",
  worst: "#DC2626",
};

export function WeekdayChart({
  data,
  metric,
  onMetricChange,
}: WeekdayChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>По дням недели</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Нет данных</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = METRIC_CONFIG[metric];

  // For delivery time, "best" is the lowest value; for others, "best" is the highest
  const isInverted = metric === "orderDeliveryTime";
  const values = data.filter((d) => d.count > 0).map((d) => d[metric]);
  const bestValue = isInverted ? Math.min(...values) : Math.max(...values);
  const worstValue = isInverted ? Math.max(...values) : Math.min(...values);

  const tickFormatter =
    metric === "salesFactAvg" || metric === "avgCheckFact" || metric === "productivityFact"
      ? (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))
      : metric === "orderDeliveryTime"
        ? (v: number) => formatDuration(v)
        : (v: number) => String(Math.round(v));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>По дням недели</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(METRIC_CONFIG) as WeekdayMetric[]).map((key) => (
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
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dayName"
              tick={{ fontSize: 13, fontWeight: 500 }}
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
            <Tooltip
              content={<CustomTooltip metric={metric} />}
            />
            <Bar
              dataKey={metric}
              name={config.label}
              radius={[6, 6, 0, 0]}
            >
              {data.map((entry) => {
                const val = entry[metric];
                let fill = COLORS.default;
                if (entry.count > 0 && val === bestValue) fill = COLORS.best;
                else if (entry.count > 0 && val === worstValue) fill = COLORS.worst;
                return <Cell key={entry.dayIndex} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS.best }} />
            Лучший день
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: COLORS.worst }} />
            Худший день
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
