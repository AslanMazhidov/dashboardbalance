"use client";

import { useEffect, useState, useCallback } from "react";
import {
  PartyPopper,
  Umbrella,
  Sun,
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
  FactorsChart,
  type FactorsDayData,
} from "@/components/charts/factors-chart";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

function getYearOptions() {
  const current = new Date().getFullYear();
  return [current, current - 1, current - 2].map(String);
}

const YEAR_OPTIONS = getYearOptions();

function toYM(year: string, monthIdx: string) {
  return `${year}-${String(Number(monthIdx) + 1).padStart(2, "0")}`;
}

interface Location {
  id: string;
  name: string;
}

interface TempRange {
  avg: number;
  avgCheck: number;
  count: number;
  label: string;
}

interface FactorsResponse {
  days: FactorsDayData[];
  summary: {
    holidayAvg: number;
    regularAvg: number;
    holidayAvgCheck: number;
    regularAvgCheck: number;
    holidayCount: number;
    regularCount: number;
    rainyAvg: number;
    dryAvg: number;
    rainyAvgCheck: number;
    dryAvgCheck: number;
    rainyCount: number;
    dryCount: number;
    temperature: {
      cold: TempRange;
      cool: TempRange;
      warm: TempRange;
    };
  };
}

function calcChange(current: number, previous: number): number | null {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default function FactorsPage() {
  const now = new Date();
  const [selectedLocation, setSelectedLocation] = useState("all");

  const [fromYear, setFromYear] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return String(d.getFullYear());
  });
  const [fromMonth, setFromMonth] = useState(() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return String(d.getMonth());
  });
  const [toYear, setToYear] = useState(() => String(now.getFullYear()));
  const [toMonth, setToMonth] = useState(() => String(now.getMonth()));

  const [data, setData] = useState<FactorsResponse | null>(null);
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
      } catch {
        /* silently fail */
      }
    }
    fetchLocations();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/factors?${buildParams()}`);
        if (res.ok) setData(await res.json());
      } catch {
        /* silently fail */
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [buildParams]);

  const holidayChange = data
    ? calcChange(data.summary.holidayAvg, data.summary.regularAvg)
    : null;
  const rainyChange = data
    ? calcChange(data.summary.rainyAvg, data.summary.dryAvg)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Факторы"
          description="Влияние погоды и праздников на выручку"
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
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={fromMonth} onValueChange={setFromMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i} value={String(i)}>
                {name}
              </SelectItem>
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
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={toMonth} onValueChange={setToMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i} value={String(i)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Праздничные дни"
            value={data.summary.holidayAvg}
            format="currency"
            trend={holidayChange ?? undefined}
            icon={PartyPopper}
            subtitle={`${data.summary.holidayCount} дн. · Ср. чек ${formatCurrency(data.summary.holidayAvgCheck)}`}
          />
          <MetricCard
            title="Обычные дни"
            value={data.summary.regularAvg}
            format="currency"
            icon={CalendarIcon}
            subtitle={`${data.summary.regularCount} дн. · Ср. чек ${formatCurrency(data.summary.regularAvgCheck)}`}
          />
          <MetricCard
            title="Дождь / Снег"
            value={data.summary.rainyAvg}
            format="currency"
            trend={rainyChange ?? undefined}
            icon={Umbrella}
            subtitle={`${data.summary.rainyCount} дн. · Ср. чек ${formatCurrency(data.summary.rainyAvgCheck)}`}
          />
          <MetricCard
            title="Сухие дни"
            value={data.summary.dryAvg}
            format="currency"
            icon={Sun}
            subtitle={`${data.summary.dryCount} дн. · Ср. чек ${formatCurrency(data.summary.dryAvgCheck)}`}
          />
        </div>
      ) : null}

      {/* Chart */}
      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Выручка и факторы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ) : data ? (
        <FactorsChart data={data.days} />
      ) : null}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Детализация по дням</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full animate-pulse rounded bg-muted"
                />
              ))}
            </div>
          ) : !data ||
            data.days.every((d) => d.salesFact === null) ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Нет данных за выбранный период
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>День</TableHead>
                    <TableHead>Погода</TableHead>
                    <TableHead className="text-right">Темп.</TableHead>
                    <TableHead className="text-right">Осадки</TableHead>
                    <TableHead>Праздник</TableHead>
                    <TableHead className="text-right">Продажи</TableHead>
                    <TableHead className="text-right">Заказы</TableHead>
                    <TableHead className="text-right">Ср. чек</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.days.map((row) => (
                    <TableRow
                      key={row.date}
                      className={cn(
                        row.salesFact === null && "opacity-40",
                        row.holidayName && "bg-amber-50/50",
                        row.isWeekend &&
                          !row.holidayName &&
                          "bg-stone-50/50",
                      )}
                    >
                      <TableCell className="font-medium">
                        {row.date.slice(5)}
                      </TableCell>
                      <TableCell>{row.dayOfWeek}</TableCell>
                      <TableCell>
                        {row.weatherIcon ? (
                          <span title={row.weatherLabel ?? ""}>
                            {row.weatherIcon} {row.weatherLabel}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.tempMean !== null
                          ? `${row.tempMean.toFixed(1)}°`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.precipitation !== null
                          ? `${row.precipitation.toFixed(1)}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {row.holidayName ? (
                          <span className="text-xs font-medium text-amber-700">
                            {row.holidayName}
                          </span>
                        ) : (
                          ""
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {row.salesFact !== null
                          ? formatCurrency(row.salesFact)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.ordersFact !== null
                          ? row.ordersFact.toLocaleString("ru-RU")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.avgCheck !== null
                          ? formatCurrency(row.avgCheck)
                          : "—"}
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
