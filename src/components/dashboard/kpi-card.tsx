"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

export function KpiCard({ title, value, change, icon: Icon, trend }: KpiCardProps) {
  const trendColor =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <Card className="gap-0 py-0">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <p className={cn("text-xs font-medium", trendColor)}>
                {formatPercent(change)} к пред. периоду
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
