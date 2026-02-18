"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency, formatDate, formatShortDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OperationsChartData {
  date: string;
  ordersFact: number;
  avgCheckFact: number;
  productivityFact: number;
  orderDeliveryTime: number;
}

interface OperationsChartProps {
  data: OperationsChartData[];
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const formatValue = (dataKey: string, value: number) => {
    switch (dataKey) {
      case "ordersFact":
        return value.toLocaleString("ru-RU");
      case "avgCheckFact":
      case "productivityFact":
        return formatCurrency(value);
      case "orderDeliveryTime":
        return formatDuration(value);
      default:
        return String(value);
    }
  };

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 text-sm font-medium text-muted-foreground">{label ? formatDate(label) : label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {formatValue(entry.dataKey, entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OperationsChart({ data }: OperationsChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Операционные показатели</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Нет данных</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Операционные показатели</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShortDate}
            />
            {/* Left axis: orders (count) & delivery time (min) */}
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => value.toLocaleString("ru-RU")}
            />
            {/* Right axis: avg check & productivity (₽) */}
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) =>
                value >= 1000 ? `${(value / 1000).toFixed(0)}k ₽` : `${value} ₽`
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              formatter={(value: string) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
            <Bar
              dataKey="ordersFact"
              name="Заказы"
              fill="#1B4332"
              yAxisId="left"
              radius={[4, 4, 0, 0]}
              opacity={0.85}
            />
            <Line
              type="monotone"
              dataKey="avgCheckFact"
              name="Ср. чек"
              stroke="#D97706"
              strokeWidth={2}
              yAxisId="right"
              dot={{ r: 2, strokeWidth: 0, fill: "#D97706" }}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="productivityFact"
              name="Производительность"
              stroke="#059669"
              strokeWidth={2}
              yAxisId="right"
              dot={{ r: 2, strokeWidth: 0, fill: "#059669" }}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="orderDeliveryTime"
              name="Время выдачи (мин)"
              stroke="#DC2626"
              strokeWidth={2}
              strokeDasharray="5 5"
              yAxisId="left"
              dot={{ r: 2, strokeWidth: 0, fill: "#DC2626" }}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
