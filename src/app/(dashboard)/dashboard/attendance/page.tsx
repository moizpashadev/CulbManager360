import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { CheckInForm } from "./check-in-form"
import { AttendanceLog } from "./attendance-log"
import { AttendanceDateNav } from "./attendance-date-nav"
import { Suspense } from "react"
import { Download } from "lucide-react"

async function getDateData(tenantId: string, dateStr: string) {
  const start = new Date(dateStr + "T00:00:00")
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const [members, log] = await Promise.all([
    prisma.member.findMany({
      where: { tenantId, status: "ACTIVE" },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.attendance.findMany({
      where: { tenantId, checkedInAt: { gte: start, lt: end } },
      include: { member: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { checkedInAt: "desc" },
    }),
  ])

  return { members, log }
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: { date?: string }
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const todayStr = new Date().toISOString().split("T")[0]
  const dateStr = searchParams.date ?? todayStr
  const isToday = dateStr === todayStr

  const { members, log } = await getDateData(session.tenantId, dateStr)

  const checkedIn = log.filter((r) => !r.checkedOutAt).length
  const checkedOut = log.filter((r) => r.checkedOutAt).length

  const displayDate = new Date(dateStr + "T00:00:00").toLocaleDateString("en-PK", { dateStyle: "full" })

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Attendance</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{displayDate}</p>
          {!isToday && (
            <p className="mt-1 text-xs font-medium text-warning">Viewing past records</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/attendance/export?from=${dateStr}&to=${dateStr}`}
            download
            className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-white px-3 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </a>
          <Suspense>
            <AttendanceDateNav currentDate={dateStr} />
          </Suspense>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: log.length },
          { label: "Currently In", value: checkedIn },
          { label: "Checked Out", value: checkedOut },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-border bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Check-in form — always for today */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Mark Check-in</h2>
            {!isToday && (
              <p className="mt-0.5 text-xs text-muted-foreground">Check-ins are always recorded for today.</p>
            )}
          </div>
          <div className="p-6">
            <CheckInForm members={members} />
          </div>
        </div>

        {/* Log */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">
              {isToday ? "Today's Log" : `Log for ${displayDate}`}
            </h2>
          </div>
          <AttendanceLog records={log} />
        </div>
      </div>
    </div>
  )
}
