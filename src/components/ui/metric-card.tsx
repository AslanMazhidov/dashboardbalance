"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

type MetricFormat = "currency" | "percent" | "number" | "duration"

interface MetricCardProps {
  title: string
  value: number
  format?: MetricFormat
  /** Small text line below the main value (e.g. "со скидками: 1 300 000 ₽") */
  subtitle?: string
  trend?: number
  trendLabel?: string
  /** Absolute value from the comparison period */
  compareValue?: number
  /** When true, negative trend is shown as positive (e.g. delivery time going down is good) */
  invertTrend?: boolean
  icon?: LucideIcon
  className?: string
}

function formatDurationValue(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}:${m.toString().padStart(2, "0")}`
}

/** Format a static value (no animation) */
function formatStatic(value: number, fmt: MetricFormat): string {
  switch (fmt) {
    case "currency":
      return new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        maximumFractionDigits: 0,
      }).format(value)
    case "percent":
      return `${value.toFixed(1)}%`
    case "number":
      return new Intl.NumberFormat("ru-RU").format(Math.round(value))
    case "duration":
      return formatDurationValue(value)
  }
}

function AnimatedNumber({
  value,
  format = "currency",
}: {
  value: number
  format: MetricFormat
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const duration = 600
    const start = performance.now()

    function animate(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(value * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [isInView, value])

  return (
    <span ref={ref} className="tabular-nums">
      {formatStatic(displayed, format)}
    </span>
  )
}

export function MetricCard({
  title,
  value,
  format = "currency",
  subtitle,
  trend,
  trendLabel,
  compareValue,
  invertTrend = false,
  icon: Icon,
  className,
}: MetricCardProps) {
  const isPositive = trend !== undefined && (invertTrend ? trend <= 0 : trend >= 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={cn(
        "rounded-2xl border border-stone-200 bg-white p-6",
        "shadow-[var(--shadow-sm)] transition-shadow duration-200",
        "hover:shadow-[var(--shadow-md)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium uppercase tracking-wide text-stone-500">
          {title}
        </p>
        {Icon && (
          <Icon className="h-4 w-4 text-stone-400" />
        )}
      </div>

      <p className="mt-2 text-[36px] font-bold leading-tight tracking-tight text-stone-900">
        <AnimatedNumber value={value} format={format} />
      </p>

      {subtitle && (
        <p className="mt-0.5 text-xs tabular-nums text-stone-400">{subtitle}</p>
      )}

      {trend !== undefined && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              isPositive
                ? "bg-profit-bg text-profit"
                : "bg-loss-bg text-loss"
            )}
          >
            {trend >= 0 ? "▲" : "▼"} {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          {compareValue !== undefined && (
            <span className="text-xs tabular-nums text-stone-400">
              было {formatStatic(compareValue, format)}
            </span>
          )}
          {trendLabel && (
            <span className="text-xs text-stone-400">{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}
