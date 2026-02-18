"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface ExpensePieData {
  category: string;
  label: string;
  amount: number;
  percentage: number;
}

interface ExpensePieProps {
  data: ExpensePieData[];
}

const COLORS = [
  "#1B4332", // brand
  "#D97706", // gold
  "#059669", // profit
  "#78716C", // stone
  "#92400E", // warm
  "#3b82f6", // blue
  "#a855f7", // purple
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percentage } = props as {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percentage: number;
  };
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percentage < 5) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${percentage.toFixed(0)}%`}
    </text>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload: ExpensePieData;
    name: string;
    value: number;
  }>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{item.label}</p>
      <p className="text-sm text-muted-foreground">
        {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
      </p>
    </div>
  );
}

export function ExpensePie({ data }: ExpensePieProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">Нет данных</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={120}
          paddingAngle={2}
          dataKey="amount"
          nameKey="label"
          label={CustomLabel}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              className="stroke-background"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: string) => (
            <span className="text-sm text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
