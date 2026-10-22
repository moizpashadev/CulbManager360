"use client"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer,
} from "recharts"

interface DataPoint { date: string; weight: number }

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{payload[0].value} kg</p>
    </div>
  )
}

export function WeightProgressChart({ data, targetWeight }: { data: DataPoint[]; targetWeight?: number | null }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        Log your weight a few times to see your trend here.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          dy={6}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={32}
          domain={["dataMin - 2", "dataMax + 2"]}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#0a8f5c", strokeWidth: 1, strokeDasharray: "4 2" }} />
        {targetWeight != null && (
          <ReferenceLine
            y={targetWeight}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            label={{ value: `Goal: ${targetWeight}kg`, fontSize: 11, fill: "#f59e0b", position: "insideTopRight" }}
          />
        )}
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#0a8f5c"
          strokeWidth={2}
          dot={{ r: 3, fill: "#0a8f5c", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#0a8f5c", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
