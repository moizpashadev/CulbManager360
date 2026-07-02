"use client"

import { useEffect, useRef } from "react"
import { animate } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCardProps {
  label: string
  value: number
  prefix?: string
  suffix?: string
  sub: string
  icon: React.ReactNode
  iconColor?: string
  trend?: { pct: number; label: string }
  /** "currency" → rounds and formats with locale thousands separator */
  format?: "currency" | "integer"
}

export function StatCard({ label, value, prefix, suffix, sub, icon, iconColor, trend, format }: StatCardProps) {
  const nodeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = nodeRef.current
    if (!node) return
    const controls = animate(0, value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate(v) {
        node.textContent = Math.round(v).toLocaleString("en-PK")
      },
    })
    return () => controls.stop()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const trendPositive = trend && trend.pct > 0
  const trendNeutral  = trend && trend.pct === 0

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconColor ?? "bg-primary/10"}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">
        {prefix && <span className="mr-0.5 text-base font-medium text-muted-foreground">{prefix}</span>}
        <span ref={nodeRef}>0</span>
        {suffix && <span className="ml-0.5 text-base font-medium text-muted-foreground">{suffix}</span>}
      </p>

      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{sub}</p>
        {trend && (
          <span className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            trendNeutral
              ? "bg-muted text-muted-foreground"
              : trendPositive
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}>
            {trendNeutral
              ? <Minus className="h-2.5 w-2.5" />
              : trendPositive
              ? <TrendingUp className="h-2.5 w-2.5" />
              : <TrendingDown className="h-2.5 w-2.5" />}
            {Math.abs(trend.pct)}% {trend.label}
          </span>
        )}
      </div>
    </div>
  )
}
