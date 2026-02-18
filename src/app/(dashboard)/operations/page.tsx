"use client";

import { useEffect, useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import { ShoppingCart, Calculator, Heart, Clock, CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { LocationFilter } from "@/components/dashboard/location-filter";
import { OrdersCheck } from "@/components/charts/orders-check";
import { ProductivityChart } from "@/components/charts/productivity-chart";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SummaryData {
  ordersFact: number;
  avgCheckFact: number;
  loyaltyPenetrationAvg: number;
  orderTimeAvg: number;
}

interface TrendData {
  date: string;
  ordersFact: number;
  avgCheckFact: number;
  loyaltyPenetration: number;
  productivityFact: number;
  productivityPlan: number;
  orderTime: number;
}

interface Location {
  id: string;
  name: string;
}

export default function OperationsPage() {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => subDays(new Date(), 60));
  const [dateTo, setDateTo] = useState(() => new Date());
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("dateFrom", format(dateFrom, "yyyy-MM-dd"));
    params.set("dateTo", format(dateTo, "yyyy-MM-dd"));
    params.set("period", "day");
    if (selectedLocation !== "all") {
      params.set("locationId", selectedLocation);
    }
    return params.toString();
  }, [dateFrom, dateTo, selectedLocation]);

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
          const raw = await summaryRes.json();
          setSummary({
            ordersFact: raw.ordersFact ?? 0,
            avgCheckFact: raw.avgCheckFact ?? 0,
            loyaltyPenetrationAvg: raw.loyaltyPenetrationAvg ?? 0,
            orderTimeAvg: raw.orderTimeAvg ?? 0,
          });
        }

        if (trendsRes.ok) {
          const raw = await trendsRes.json();
          setTrends(raw.data || raw);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [buildParams]);

  return (
    <div className="space-y-6">
      {/* Page header with filters */}
      <PageHeader title="Операционные метрики" description="Заказы, лояльность, производительность">
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

      {/* KPI Cards */}
      {loading ? (
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
      ) : summary ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Заказы"
            value={summary.ordersFact}
            format="number"
            icon={ShoppingCart}
          />
          <MetricCard
            title="Средний чек"
            value={summary.avgCheckFact}
            format="currency"
            icon={Calculator}
          />
          <MetricCard
            title="Лояльность"
            value={summary.loyaltyPenetrationAvg * 100}
            format="percent"
            icon={Heart}
          />
          <MetricCard
            title="Время выдачи"
            value={summary.orderTimeAvg}
            format="number"
            trendLabel=" мин"
            icon={Clock}
          />
        </div>
      ) : null}

      {/* Charts: Orders & Check + Productivity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Заказы и средний чек</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
            ) : (
              <OrdersCheck data={trends} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Производительность</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
            ) : (
              <ProductivityChart data={trends} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Operations Table */}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Заказы</TableHead>
                  <TableHead className="text-right">Ср. чек</TableHead>
                  <TableHead className="text-right">Лояльность %</TableHead>
                  <TableHead className="text-right">Производительность</TableHead>
                  <TableHead className="text-right">Время выдачи</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {row.ordersFact.toLocaleString("ru-RU")}
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
                      {row.orderTime ?? 0} мин
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
