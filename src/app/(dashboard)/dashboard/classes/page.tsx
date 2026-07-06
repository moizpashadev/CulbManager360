import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Clock, Users } from "lucide-react"
import { ClassActions } from "./class-actions"
import { GridSearch } from "@/components/grid-search"
import { Suspense } from "react"

const DAYS = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: { q?: string; day?: string }
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { q, day } = searchParams
  const dayNum = day ? parseInt(day) : undefined

  const where: Record<string, unknown> = { tenantId: session.tenantId }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ]
  }
  if (dayNum && dayNum >= 1 && dayNum <= 7) where.dayOfWeek = dayNum

  const classes = await prisma.classSchedule.findMany({
    where,
    include: {
      instructor: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  const canManage = ["OWNER", "ADMIN", "MANAGER"].includes(session.role)

  // Group by day (only when no search)
  const byDay: Record<number, typeof classes> = {}
  for (const cls of classes) {
    if (!byDay[cls.dayOfWeek]) byDay[cls.dayOfWeek] = []
    byDay[cls.dayOfWeek].push(cls)
  }

  const showWeeklyGrid = !q && !day

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Classes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {classes.filter((c) => c.isActive).length} active{q ? ` matching "${q}"` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Suspense>
            <GridSearch placeholder="Search classes…" basePath="/dashboard/classes" />
          </Suspense>
          {canManage && (
            <Link href="/dashboard/classes/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Class
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Day filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={q ? `/dashboard/classes?q=${q}` : "/dashboard/classes"}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !day ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
          }`}
        >
          All Days
        </Link>
        {DAY_LABELS.map((label, i) => {
          const d = i + 1
          const params = new URLSearchParams()
          if (q) params.set("q", q)
          params.set("day", String(d))
          return (
            <Link
              key={d}
              href={`/dashboard/classes?${params}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                day === String(d) ? "bg-primary text-white" : "border border-border bg-white text-foreground hover:bg-muted/40"
              }`}
            >
              {label.slice(0, 3)}
            </Link>
          )
        })}
      </div>

      {classes.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            {q ? `No classes match "${q}".` : "No classes scheduled yet."}
          </p>
          {!q && canManage && (
            <Link href="/dashboard/classes/new" className="mt-4 inline-block">
              <Button variant="outline" size="sm">Schedule your first class</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Weekly grid — only when not searching */}
          {showWeeklyGrid && (
            <div className="rounded-lg border border-border bg-white shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-sm font-medium text-foreground">Weekly Schedule</h2>
              </div>
              <div className="overflow-x-auto">
                <div className="grid grid-cols-7 divide-x divide-border min-w-[640px]">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <div key={d} className="min-h-[100px] p-2">
                      <p className={`mb-2 text-center text-xs font-semibold uppercase tracking-wide ${
                        byDay[d]?.length ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {DAYS[d]}
                      </p>
                      <div className="space-y-1">
                        {(byDay[d] ?? []).filter((c) => c.isActive).map((cls) => (
                          <div key={cls.id} className="rounded bg-secondary px-1.5 py-1 text-[10px] leading-tight">
                            <p className="font-semibold text-primary truncate">{cls.title}</p>
                            <p className="text-muted-foreground">{formatTime(cls.startTime)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full list */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">
                {q ? `Results for "${q}"` : day ? `${DAY_LABELS[parseInt(day) - 1]} Classes` : "All Classes"}
              </h2>
            </div>
            <div className="divide-y divide-border">
              {classes.map((cls) => (
                <div key={cls.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <span className="text-xs font-bold text-primary">{DAYS[cls.dayOfWeek]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{cls.title}</p>
                        {!cls.isActive && <Badge variant="secondary">Inactive</Badge>}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(cls.startTime)} – {formatTime(cls.endTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cls._count.bookings}/{cls.capacity} booked
                        </span>
                        {cls.instructor && (
                          <span>{cls.instructor.firstName} {cls.instructor.lastName}</span>
                        )}
                      </div>
                      {cls.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{cls.description}</p>
                      )}
                    </div>
                  </div>
                  {canManage && <ClassActions classId={cls.id} isActive={cls.isActive} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
