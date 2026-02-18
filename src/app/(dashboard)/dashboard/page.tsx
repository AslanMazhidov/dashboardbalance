"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  DollarSign,
  Target,
  Percent,
  Truck,
  ShoppingCart,
  Calculator,
  Heart,
  Clock,
  CalendarIcon,
  ArrowLeftRight,
} from "lucide-react";
import { subDays, subYears, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { LocationFilter } from "@/components/dashboard/location-filter";
import { SalesPlanFact } from "@/components/charts/sales-plan-fact";
import { OrdersCheck } from "@/components/charts/orders-check";
import { ProductivityChart } from "@/components/charts/productivity-chart";
import { formatCurrency, formatDate, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type CompareMode = "prev" | "year" | "custom";

interface SummaryData {
  salesFact: number;
  salesPlan: number;
  salesDeviation: number;
  ordersFact: number;
  ordersPlan: number;
  ordersDeviation: number;
  avgCheckFact: number;
  avgCheckPlan: number;
  avgCheckDeviation: number;
  loyaltyPenetrationAvg: number;
  productivityAvg: number;
  orderTimeAvg: number;
  discountsTotal: number;
  yandexFoodTotal: number;
  // All change metrics
  salesChange: number;
  salesPlanChange: number;
  ordersChange: number;
  avgCheckChange: number;
  discountsChange: number;
  yandexFoodChange: number;
  loyaltyChange: number;
  productivityChange: number;
  orderTimeChange: number;
}

interface TrendData {
  date: string;
  salesPlan: number;
  salesFact: number;
  discounts: number;
  yandexFood: number;
  ordersFact: number;
  avgCheckFact: number;
  loyaltyPenetration: number;
  productivityPlan: number;
  productivityFact: number;
  orderDeliveryTime: number;
}

interface Location {
  id: string;
  name: string;
}

const COMPARE_LABELS: Record<CompareMode, string> = {
  prev: "vs пред. период",
  year: "vs год назад",
  custom: "vs выбр. период",
};

export default function DashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => subDays(new Date(), 60));
  const [dateTo, setDateTo] = useState(() => new Date());
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  // Comparison period
  const [compareMode, setCompareMode] = useState<CompareMode>("prev");
  const [customCompareFrom, setCustomCompareFrom] = useState(() => subDays(new Date(), 120));
  const [customCompareTo, setCustomCompareTo] = useState(() => subDays(new Date(), 61));
  const [cmpFromOpen, setCmpFromOpen] = useState(false);
  const [cmpToOpen, setCmpToOpen] = useState(false);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const trendLabel = COMPARE_LABELS[compareMode];

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("dateFrom", format(dateFrom, "yyyy-MM-dd"));
    params.set("dateTo", format(dateTo, "yyyy-MM-dd"));
    if (selectedLocation !== "all") params.set("locationId", selectedLocation);

    if (compareMode === "year") {
      params.set("compareFrom", format(subYears(dateFrom, 1), "yyyy-MM-dd"));
      params.set("compareTo", format(subYears(dateTo, 1), "yyyy-MM-dd"));
    } else if (compareMode === "custom") {
      params.set("compareFrom", format(customCompareFrom, "yyyy-MM-dd"));
      params.set("compareTo", format(customCompareTo, "yyyy-MM-dd"));
    }
    // "prev" — no extra params, API auto-calculates

    return params.toString();
  }, [dateFrom, dateTo, selectedLocation, compareMode, customCompareFrom, customCompareTo]);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const res = await fetch("/api/locations");
        if (res.ok) {
          const data = await res.json();
          setLocations(data);
        }
      } catch {
        // silently fail
      }
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const qs = buildParams();

      try {
        const [summaryRes, trendsRes] = await Promise.all([
          fetch(`/api/reports/summary?${qs}`),
          fetch(`/api/reports/trends?${qs}`),
        ]);

        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setSummary(data);
        }
        if (trendsRes.ok) {
          const raw = await trendsRes.json();
          setTrends(raw.data || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [buildParams]);

  const SkeletonCards = () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="gap-0 py-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-7 w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header with filters */}
      <PageHeader title="Дашборд" description="Все ключевые показатели">
        <div className="flex flex-wrap items-center gap-3">
          <LocationFilter
            value={selectedLocation}
            onChange={setSelectedLocation}
            locations={locations}
          />
          <Popover open={fromOpen} onOpenChange={setFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd.MM.yyyy") : "С"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(date) => {
                  if (date) setDateFrom(date);
                  setFromOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Popover open={toOpen} onOpenChange={setToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "dd.MM.yyyy") : "По"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(date) => {
                  if (date) setDateTo(date);
                  setToOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </PageHeader>

      {/* Comparison period selector */}
      <div className="flex flex-wrap items-center gap-3">
        <ArrowLeftRight className="h-4 w-4 text-stone-400" />
        <span className="text-sm text-stone-500">Сравнивать с:</span>
        <Select value={compareMode} onValueChange={(v) => setCompareMode(v as CompareMode)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="prev">Предыдущий период</SelectItem>
            <SelectItem value="year">Год назад</SelectItem>
            <SelectItem value="custom">Свои даты</SelectItem>
          </SelectContent>
        </Select>

        {compareMode === "custom" && (
          <>
            <Popover open={cmpFromOpen} onOpenChange={setCmpFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(customCompareFrom, "dd.MM.yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customCompareFrom}
                  onSelect={(date) => {
                    if (date) setCustomCompareFrom(date);
                    setCmpFromOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover open={cmpToOpen} onOpenChange={setCmpToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[140px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(customCompareTo, "dd.MM.yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customCompareTo}
                  onSelect={(date) => {
                    if (date) setCustomCompareTo(date);
                    setCmpToOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {/* === ПРОДАЖИ === */}
      <h2 className="text-base font-semibold text-slate-700">Продажи</h2>

      {/* Sales KPI Cards */}
      {loading ? (
        <SkeletonCards />
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Продажи факт"
            value={summary.salesFact}
            format="currency"
            trend={summary.salesChange}
            trendLabel={trendLabel}
            icon={DollarSign}
          />
          <MetricCard
            title="План продаж"
            value={summary.salesPlan}
            format="currency"
            trend={summary.salesPlanChange}
            trendLabel={trendLabel}
            icon={Target}
          />
          <MetricCard
            title="Скидки"
            value={summary.discountsTotal}
            format="currency"
            trend={summary.discountsChange}
            trendLabel={trendLabel}
            icon={Percent}
          />
          <MetricCard
            title="Яндекс Еда"
            value={summary.yandexFoodTotal}
            format="currency"
            trend={summary.yandexFoodChange}
            trendLabel={trendLabel}
            icon={Truck}
          />
        </div>
      ) : null}

      {/* Sales Plan vs Fact Chart */}
      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>План / Факт продаж</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ) : (
        <SalesPlanFact data={trends} />
      )}

      {/* === ОПЕРАЦИОННЫЕ МЕТРИКИ === */}
      <h2 className="text-base font-semibold text-slate-700">Операционные метрики</h2>

      {/* Operations KPI Cards */}
      {loading ? (
        <SkeletonCards />
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Заказы"
            value={summary.ordersFact}
            format="number"
            trend={summary.ordersChange}
            trendLabel={trendLabel}
            icon={ShoppingCart}
          />
          <MetricCard
            title="Средний чек"
            value={summary.avgCheckFact}
            format="currency"
            trend={summary.avgCheckChange}
            trendLabel={trendLabel}
            icon={Calculator}
          />
          <MetricCard
            title="Лояльность"
            value={summary.loyaltyPenetrationAvg * 100}
            format="percent"
            trend={summary.loyaltyChange}
            trendLabel={trendLabel}
            icon={Heart}
          />
          <MetricCard
            title="Время выдачи"
            value={summary.orderTimeAvg}
            format="duration"
            trend={summary.orderTimeChange}
            trendLabel={trendLabel}
            invertTrend
            icon={Clock}
          />
        </div>
      ) : null}

      {/* Charts: Orders/Check + Productivity */}
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Заказы и средний чек</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Производительность</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <OrdersCheck data={trends} />
          <ProductivityChart data={trends} />
        </div>
      )}

      {/* === ДЕТАЛИЗАЦИЯ ПО ДНЯМ === */}
      <Card>
        <CardHeader>
          <CardTitle>Детализация по дням</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : trends.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Продажи</TableHead>
                    <TableHead className="text-right">План</TableHead>
                    <TableHead className="text-right">Откл. %</TableHead>
                    <TableHead className="text-right">Скидки</TableHead>
                    <TableHead className="text-right">Яндекс</TableHead>
                    <TableHead className="text-right">Заказы</TableHead>
                    <TableHead className="text-right">Ср. чек</TableHead>
                    <TableHead className="text-right">Лояльность</TableHead>
                    <TableHead className="text-right">Произв.</TableHead>
                    <TableHead className="text-right">Выдача</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trends.map((row) => {
                    const deviation =
                      row.salesPlan > 0
                        ? ((row.salesFact - row.salesPlan) / row.salesPlan) * 100
                        : 0;
                    return (
                      <TableRow key={row.date}>
                        <TableCell>{formatDate(row.date)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(row.salesFact)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.salesPlan)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-medium",
                            deviation >= 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {deviation >= 0 ? "+" : ""}
                          {deviation.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.discounts ?? 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.yandexFood ?? 0)}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.ordersFact}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.avgCheckFact)}
                        </TableCell>
                        <TableCell className="text-right">
                          {((row.loyaltyPenetration ?? 0) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(row.productivityFact)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatDuration(row.orderDeliveryTime ?? 0)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
