"use client";

import { useEffect, useState, useCallback } from "react";
import { DollarSign, Calculator, ShoppingCart, Heart } from "lucide-react";
import { subDays, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { LocationFilter } from "@/components/dashboard/location-filter";
import { SalesPlanFact } from "@/components/charts/sales-plan-fact";
import { OrdersCheck } from "@/components/charts/orders-check";
import { ProductivityChart } from "@/components/charts/productivity-chart";
import { formatCurrency } from "@/lib/format";

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
  salesChange: number;
  ordersChange: number;
  avgCheckChange: number;
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

export default function DashboardPage() {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [dateFrom] = useState(() => subDays(new Date(), 60));
  const [dateTo] = useState(() => new Date());

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set("dateFrom", format(dateFrom, "yyyy-MM-dd"));
    params.set("dateTo", format(dateTo, "yyyy-MM-dd"));
    if (selectedLocation !== "all") params.set("locationId", selectedLocation);
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

  const lastTenTrends = trends.slice(-10);

  return (
    <div className="space-y-6">
      {/* Page header with filters */}
      <PageHeader title="Дашборд" description="Обзор ключевых показателей">
        <div className="flex flex-wrap items-center gap-3">
          <LocationFilter
            value={selectedLocation}
            onChange={setSelectedLocation}
            locations={locations}
          />
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
            title="Продажи"
            value={summary.salesFact}
            format="currency"
            trend={summary.salesChange}
            trendLabel="vs пред. период"
            icon={DollarSign}
          />
          <MetricCard
            title="Средний чек"
            value={summary.avgCheckFact}
            format="currency"
            trend={summary.avgCheckChange}
            trendLabel="vs пред. период"
            icon={Calculator}
          />
          <MetricCard
            title="Заказы"
            value={summary.ordersFact}
            format="number"
            trend={summary.ordersChange}
            trendLabel="vs пред. период"
            icon={ShoppingCart}
          />
          <MetricCard
            title="Лояльность"
            value={summary.loyaltyPenetrationAvg * 100}
            format="percent"
            icon={Heart}
          />
        </div>
      ) : null}

      {/* Charts */}
      {loading ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Продажи: План vs Факт</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Заказы и средний чек</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Продуктивность</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Full width: Sales Plan vs Fact */}
          <SalesPlanFact data={trends} />

          {/* Half-width row: Orders/Check + Productivity */}
          <div className="grid gap-6 lg:grid-cols-2">
            <OrdersCheck data={trends} />
            <ProductivityChart data={trends} />
          </div>
        </>
      )}

      {/* Table: last 10 trend rows */}
      <Card>
        <CardHeader>
          <CardTitle>Данные за последние дни</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] w-full animate-pulse rounded bg-muted" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right">Продажи факт</TableHead>
                  <TableHead className="text-right">План</TableHead>
                  <TableHead className="text-right">Отклонение %</TableHead>
                  <TableHead className="text-right">Заказы</TableHead>
                  <TableHead className="text-right">Ср. чек</TableHead>
                  <TableHead className="text-right">Лояльность %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lastTenTrends.map((row) => {
                  const deviation =
                    row.salesPlan > 0
                      ? ((row.salesFact - row.salesPlan) / row.salesPlan) * 100
                      : 0;
                  return (
                    <TableRow key={row.date}>
                      <TableCell>
                        {format(new Date(row.date), "dd.MM.yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.salesFact)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.salesPlan)}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          deviation >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {deviation >= 0 ? "+" : ""}
                        {deviation.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {row.ordersFact}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(row.avgCheckFact)}
                      </TableCell>
                      <TableCell className="text-right">
                        {(row.loyaltyPenetration * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
