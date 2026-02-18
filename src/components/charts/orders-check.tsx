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
import { formatCurrency } from "@/lib/format";

interface OrdersCheckData {
  date: string;
  ordersFact: number;
  avgCheckFact: number;
}

interface OrdersCheckProps {
  data: OrdersCheckData[];
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
          <span className="font-medium">
            {entry.dataKey === "avgCheckFact"
              ? formatCurrency(entry.value)
              : entry.value.toLocaleString("ru-RU")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OrdersCheck({ data }: OrdersCheckProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Нет данных</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
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
        />
        <YAxis
          yAxisId="left"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => value.toLocaleString("ru-RU")}
        />
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
        />
        <Line
          type="monotone"
          dataKey="avgCheckFact"
          name="Ср. чек"
          stroke="#D97706"
          strokeWidth={2}
          yAxisId="right"
          dot={{ r: 3, strokeWidth: 0, fill: "#D97706" }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
