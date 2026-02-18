"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
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
import { PageHeader } from "@/components/ui/page-header";
import { LocationFilter } from "@/components/dashboard/location-filter";
import {
  WeekdayChart,
  type WeekdayData,
  type WeekdayMetric,
} from "@/components/charts/weekday-chart";
import { formatCurrency, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

type PeriodMode = "months" | "dates";

const MONTH_NAMES = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function getYearOptions() {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2].map(String);
}

interface Location {
  id: string;
  name: string;
}

interface WeekdayResponse {
  days: WeekdayData[];
  bestDay: WeekdayData;
  worstDay: WeekdayData;
}

const YEAR_OPTIONS = getYearOptions();

export default function AnalyticsPage() {
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("months");
  const [selectedYear, setSelectedYear] = useState(() => String(new Date().getFullYear()));
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(() => String(new Date().getMonth()));
  const [dateFrom, setDateFrom] = useState(() => startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState(() => endOfMonth(new Date()));
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const syncDatesFromYM = useCallback((year: string, month: string) => {
    const d = new Date(Number(year), Number(month), 1);
    setDateFrom(startOfMonth(d));
    setDateTo(endOfMonth(d));
  }, []);

  const handleYearChange = useCallback((y: string) => {
    setSelectedYear(y);
    syncDatesFromYM(y, selectedMonthIdx);
  }, [selectedMonthIdx, syncDatesFromYM]);

  const handleMonthIdxChange = useCallback((m: string) => {
    setSelectedMonthIdx(m);
    syncDatesFromYM(selectedYear, m);
  }, [selectedYear, syncDatesFromYM]);

  const handlePeriodModeChange = useCallback((mode: PeriodMode) => {
    setPeriodMode(mode);
    if (mode === "months") {
      setSelectedYear(String(dateFrom.getFullYear()));
      setSelectedMonthIdx(String(dateFrom.getMonth()));
      setDateFrom(startOfMonth(dateFrom));
      setDateTo(endOfMonth(dateFrom));
    }
  }, [dateFrom]);

  const [data, setData] = useState<WeekdayResponse | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<WeekdayMetric>("salesFactAvg");

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
        if (res.ok) setLocations(await res.json());
      } catch { /* silently fail */ }
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/weekday?${buildParams()}`);
        if (res.ok) setData(await res.json());
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    }
    fetchData();
  }, [buildParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Аналитика"
          description="Анализ показателей по дням недели"
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
        <span className="w-[95px] text-sm text-stone-500">Период:</span>
        <div className="flex rounded-lg border border-stone-200">
          <button
            onClick={() => handlePeriodModeChange("months")}
            className={cn(
              "px-3 py-1.5 text-sm transition-colors rounded-l-lg",
              periodMode === "months"
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            Месяц
          </button>
          <button
            onClick={() => handlePeriodModeChange("dates")}
            className={cn(
              "px-3 py-1.5 text-sm transition-colors rounded-r-lg",
              periodMode === "dates"
                ? "bg-stone-900 text-white"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            Даты
          </button>
        </div>

        {periodMode === "months" ? (
          <>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEAR_OPTIONS.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonthIdx} onValueChange={handleMonthIdxChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Best / Worst day cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Лучший день</p>
                <p className="text-2xl font-bold text-green-900">
                  {data.bestDay.dayName}
                </p>
                <p className="text-sm text-green-700">
                  Ср. продажи: {formatCurrency(data.bestDay.salesFactAvg)}
                  {" · "}
                  Заказов: {Math.round(data.bestDay.ordersFactAvg)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-800">Худший день</p>
                <p className="text-2xl font-bold text-red-900">
                  {data.worstDay.dayName}
                </p>
                <p className="text-sm text-red-700">
                  Ср. продажи: {formatCurrency(data.worstDay.salesFactAvg)}
                  {" · "}
                  Заказов: {Math.round(data.worstDay.ordersFactAvg)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Chart */}
      {loading ? (
        <Card>
          <CardHeader><CardTitle>По дням недели</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[350px] w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ) : data ? (
        <WeekdayChart
          data={data.days}
          metric={metric}
          onMetricChange={setMetric}
        />
      ) : null}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Детализация по дням недели</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : !data || data.days.every((d) => d.count === 0) ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">Нет данных за выбранный период</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>День</TableHead>
                    <TableHead className="text-right">Дней</TableHead>
                    <TableHead className="text-right">Ср. продажи</TableHead>
                    <TableHead className="text-right">Ср. план</TableHead>
                    <TableHead className="text-right">Ср. заказы</TableHead>
                    <TableHead className="text-right">Ср. чек</TableHead>
                    <TableHead className="text-right">Произв.</TableHead>
                    <TableHead className="text-right">Выдача</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.days.map((day) => (
                    <TableRow
                      key={day.dayIndex}
                      className={cn(
                        day.dayName === data.bestDay.dayName && "bg-green-50/50",
                        day.dayName === data.worstDay.dayName && "bg-red-50/50"
                      )}
                    >
                      <TableCell className="font-medium">{day.dayName}</TableCell>
                      <TableCell className="text-right">{day.count}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(day.salesFactAvg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(day.salesPlanAvg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {Math.round(day.ordersFactAvg)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(day.avgCheckFact)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(day.productivityFact)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatDuration(day.orderDeliveryTime)}
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
