"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function AttendanceDateNav({ currentDate }: { currentDate: string }) {
  const router = useRouter()

  function go(offset: number) {
    const d = new Date(currentDate + "T00:00:00")
    d.setDate(d.getDate() + offset)
    router.push(`/dashboard/attendance?date=${d.toISOString().split("T")[0]}`)
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) router.push(`/dashboard/attendance?date=${e.target.value}`)
  }

  const todayStr = new Date().toISOString().split("T")[0]
  const isToday = currentDate === todayStr

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => go(-1)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground hover:bg-muted/40 hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <input
        type="date"
        value={currentDate}
        max={todayStr}
        onChange={handleDateChange}
        className="h-8 rounded-md border border-border bg-white px-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />

      <button
        onClick={() => go(1)}
        disabled={isToday}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-white text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {!isToday && (
        <button
          onClick={() => router.push("/dashboard/attendance")}
          className="h-8 rounded-md border border-border bg-white px-3 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          Today
        </button>
      )}
    </div>
  )
}
