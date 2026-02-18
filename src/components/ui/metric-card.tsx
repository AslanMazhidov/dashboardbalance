"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: number
  format?: "currency" | "percent" | "number"
  trend?: number
  trendLabel?: string
  icon?: LucideIcon
  className?: string
}

function AnimatedNumber({
  value,
  format = "currency",
}: {
  value: number
  format: "currency" | "percent" | "number"
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
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(value * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [isInView, value])

  const formatted = (() => {
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("ru-RU", {
          style: "currency",
          currency: "RUB",
          maximumFractionDigits: 0,
        }).format(displayed)
      case "percent":
        return `${displayed.toFixed(1)}%`
      case "number":
        return new Intl.NumberFormat("ru-RU").format(Math.round(displayed))
    }
  })()

  return (
    <span ref={ref} className="tabular-nums">
      {formatted}
    </span>
  )
}

export function MetricCard({
  title,
  value,
  format = "currency",
  trend,
  trendLabel,
  icon: Icon,
  className,
}: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0

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

      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              isPositive
                ? "bg-profit-bg text-profit"
                : "bg-loss-bg text-loss"
            )}
          >
            {isPositive ? "▲" : "▼"} {isPositive ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
          {trendLabel && (
            <span className="text-xs text-stone-400">{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}
