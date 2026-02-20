"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  ShoppingCart,
  Receipt,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/ui/page-header";
import { LocationFilter } from "@/components/dashboard/location-filter";
import {
  MonthlyTrendsChart,
  type MonthlyTrendData,
  type TrendMetric,
} from "@/components/charts/monthly-trends-chart";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function getYearOptions() {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2].map(String);
}

const YEAR_OPTIONS = getYearOptions();

/** Format YYYY-MM from year and month index */
function toYM(year: string, monthIdx: string) {
  return `${year}-${String(Number(monthIdx) + 1).padStart(2, "0")}`;
}

interface Location {
  id: string;
  name: string;
}

interface TrendsResponse {
  data: MonthlyTrendData[];
  summary: {
    totalSales: number;
    totalOrders: number;
    avgCheck: number;
    avgProductivity: number;
  };
  previous: {
    totalSales: number;
    totalOrders: number;
    avgCheck: number;
    avgProductivity: number;
  };
}

function calcChange(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default function TrendsPage() {
  const now = new Date();
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [metric, setMetric] = useState<TrendMetric>("salesFact");

  // "From" defaults to 3 months ago
  const [fromYear, setFromYear] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return String(d.getFullYear());
  });
  const [fromMonth, setFromMonth] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return String(d.getMonth());
  });
  // "To" defaults to current month
  const [toYear, setToYear] = useState(() => String(now.getFullYear()));
  const [toMonth, setToMonth] = useState(() => String(now.getMonth()));

  const [data, setData] = useState<TrendsResponse | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("dateFrom", toYM(fromYear, fromMonth));
    params.set("dateTo", toYM(toYear, toMonth));
    if (selectedLocation !== "all") params.set("locationId", selectedLocation);
    return params.toString();
  }, [fromYear, fromMonth, toYear, toMonth, selectedLocation]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/locations");
        if (res.ok) setLocations(await res.json());
      } catch { /* silently fail */ }
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/monthly-trends?${buildParams()}`);
        if (res.ok) setData(await res.json());
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    fetchData();
  }, [buildParams]);

  const salesChange = data ? calcChange(data.summary.totalSales, data.previous.totalSales) : null;
  const ordersChange = data ? calcChange(data.summary.totalOrders, data.previous.totalOrders) : null;
  const checkChange = data ? calcChange(data.summary.avgCheck, data.previous.avgCheck) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Тренды"
          description="Динамика показателей за длинный период"
        />
        <LocationFilter
          value={selectedLocation}
          onChange={setSelectedLocation}
          locations={locations}
        />
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-3">
        <CalendarIcon className="h-4 w-4 text-stone-400" />
        <span className="text-sm text-stone-500">С:</span>
        <Select value={fromYear} onValueChange={setFromYear}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fromMonth} onValueChange={setFromMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i} value={String(i)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-stone-500">По:</span>
        <Select value={toYear} onValueChange={setToYear}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={toMonth} onValueChange={setToMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i} value={String(i)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            title="Продажи"
            value={data.summary.totalSales}
            format="currency"
            trend={salesChange ?? undefined}
            compareValue={data.previous.totalSales}
            trendLabel="vs пред. период"
            icon={TrendingUp}
          />
          <MetricCard
            title="Заказы"
            value={data.summary.totalOrders}
            format="number"
            trend={ordersChange ?? undefined}
            compareValue={data.previous.totalOrders}
            trendLabel="vs пред. период"
            icon={ShoppingCart}
          />
          <MetricCard
            title="Средний чек"
            value={data.summary.avgCheck}
            format="currency"
            trend={checkChange ?? undefined}
            compareValue={data.previous.avgCheck}
            trendLabel="vs пред. период"
            icon={Receipt}
          />
        </div>
      ) : null}

      {/* Chart */}
      {loading ? (
        <Card>
          <CardHeader><CardTitle>Тренды</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[400px] w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ) : data ? (
        <MonthlyTrendsChart
          data={data.data}
          metric={metric}
          onMetricChange={setMetric}
        />
      ) : null}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Помесячная детализация</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !data || data.data.every((d) => d.count === 0) ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Месяц</TableHead>
                    <TableHead className="text-right">Дней</TableHead>
                    <TableHead className="text-right">Продажи</TableHead>
                    <TableHead className="text-right">План</TableHead>
                    <TableHead className="text-right">Заказы</TableHead>
                    <TableHead className="text-right">Ср. чек</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((row) => (
                    <TableRow
                      key={row.month}
                      className={cn(row.count === 0 && "opacity-40")}
                    >
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.salesFact)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.salesPlan)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.ordersFact.toLocaleString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.avgCheckFact)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
