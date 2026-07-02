import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import {
  TrainerCheckinButton,
  AddSlotForm,
  DeleteSlotButton,
  AssignMemberForm,
  RemoveAssignmentButton,
} from "./trainer-actions"
import { TrainerEditForm } from "./trainer-edit-form"

type Props = { params: { id: string } }

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const employmentLabel: Record<string, string> = {
  SALARIED: "Salaried",
  COMMISSION: "Commission-Based",
  SELF_EMPLOYED: "Self-Employed",
}
const employmentBadge: Record<string, "success" | "warning" | "secondary"> = {
  SALARIED: "success", COMMISSION: "warning", SELF_EMPLOYED: "secondary",
}

function fmt(n: number) {
  return `PKR ${n.toLocaleString("en-PK")}`
}

export default async function TrainerDashboardPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const todayIdx = now.getDay() === 0 ? 6 : now.getDay() - 1 // 0=Mon

  const branches = await prisma.branch.findMany({
    where: { tenantId: session.tenantId, isActive: true },
    orderBy: { name: "asc" },
  })

  const trainer = await prisma.staff.findFirst({
    where: { id: params.id, tenantId: session.tenantId, role: "TRAINER" },
    include: {
      staffBranches: {
        include: { branch: true },
      },
      trainerSlots: {
        where: { isActive: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        include: {
          branch: { select: { id: true, name: true } },
          assignments: {
            where: { status: "ACTIVE" },
            include: {
              member: { select: { id: true, firstName: true, lastName: true } },
            },
          },
          _count: { select: { assignments: { where: { status: "ACTIVE" } } } },
        },
      },
      trainerAssign: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          member: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
          branch: { select: { id: true, name: true } },
          slot: { select: { dayOfWeek: true, startTime: true, endTime: true } },
        },
      },
      trainerAttendance: {
        orderBy: { checkedInAt: "desc" },
        take: 14,
        include: { branch: { select: { id: true, name: true } } },
      },
    },
  })

  if (!trainer) notFound()

  // Earnings
  let earningsThisMonth = 0
  if (trainer.employmentType === "SALARIED" && trainer.salaryAmount) {
    earningsThisMonth = Number(trainer.salaryAmount)
  } else if (trainer.employmentType === "COMMISSION" && trainer.commissionRate) {
    const memberIds = trainer.trainerAssign.map((a) => a.memberId)
    const rev = await prisma.invoice.aggregate({
      where: { tenantId: session.tenantId, memberId: { in: memberIds }, paymentStatus: "PAID", createdAt: { gte: monthStart } },
      _sum: { total: true },
    })
    earningsThisMonth = (Number(rev._sum.total ?? 0) * Number(trainer.commissionRate)) / 100
  }

  const todayAttendance = trainer.trainerAttendance.find((a) => new Date(a.checkedInAt) >= today && new Date(a.checkedInAt) < tomorrow)
  const trainerBranches = trainer.staffBranches.map((sb) => sb.branch)
  const todaySlots = trainer.trainerSlots.filter((s) => s.dayOfWeek === todayIdx)

  // Build weekly schedule grid
  const slotsByDay: typeof trainer.trainerSlots[] = Array.from({ length: 7 }, (_, i) =>
    trainer.trainerSlots.filter((s) => s.dayOfWeek === i)
  )

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/trainers">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div className="flex flex-1 items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {trainer.firstName} {trainer.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {trainer.specialization ?? "General Trainer"}
              {trainerBranches.length > 0 && ` · ${trainerBranches.map((b) => b.name).join(", ")}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {trainer.employmentType && (
              <Badge variant={employmentBadge[trainer.employmentType]}>
                {employmentLabel[trainer.employmentType]}
              </Badge>
            )}
            <Badge variant={trainer.isActive ? "success" : "secondary"}>
              {trainer.isActive ? "Active" : "Inactive"}
            </Badge>
            <TrainerEditForm
              trainerId={trainer.id}
              allBranches={branches}
              defaultValues={{
                firstName: trainer.firstName,
                lastName: trainer.lastName,
                email: trainer.email ?? "",
                specialization: trainer.specialization ?? "",
                bio: trainer.bio ?? "",
                employmentType: trainer.employmentType ?? "",
                salaryAmount: trainer.salaryAmount ? String(trainer.salaryAmount) : "",
                commissionRate: trainer.commissionRate ? String(trainer.commissionRate) : "",
                isActive: trainer.isActive,
                branchIds: trainer.staffBranches.map((sb) => sb.branch.id),
              }}
            />
          </div>
        </div>
      </div>

      {/* Check-in + KPIs */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-white px-6 py-4 shadow-sm">
        <TrainerCheckinButton
          trainerId={trainer.id}
          branches={trainerBranches.length > 0 ? trainerBranches : branches}
          todayAttendance={todayAttendance ? {
            id: todayAttendance.id,
            checkedOutAt: todayAttendance.checkedOutAt?.toISOString() ?? null,
            branch: { name: todayAttendance.branch.name },
          } : null}
        />
        <div className="flex gap-6">
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-foreground">{trainer.trainerAssign.length}</p>
            <p className="text-xs text-muted-foreground">Active Members</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-foreground">{todaySlots.length}</p>
            <p className="text-xs text-muted-foreground">Slots Today</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-bold text-primary">
              {earningsThisMonth > 0 ? `PKR ${earningsThisMonth.toLocaleString("en-PK")}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {trainer.employmentType === "SALARIED" ? "Monthly Salary" :
               trainer.employmentType === "COMMISSION" ? "Commission This Month" : "Earnings"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: weekly schedule */}
        <div className="space-y-5 lg:col-span-2">
          {/* Weekly schedule */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Weekly Schedule</h2>
              <AddSlotForm
                trainerId={trainer.id}
                branches={trainerBranches.length > 0 ? trainerBranches : branches}
              />
            </div>

            {trainer.trainerSlots.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No availability slots configured. Add slots to start accepting members.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {slotsByDay.map((daySlots, dayIdx) => {
                  if (daySlots.length === 0) return null
                  const isToday = dayIdx === todayIdx
                  return (
                    <div key={dayIdx} className={`px-6 py-3 ${isToday ? "bg-secondary/30" : ""}`}>
                      <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {DAYS[dayIdx]}{isToday && " · Today"}
                      </p>
                      <div className="space-y-1.5">
                        {daySlots.map((slot) => {
                          const filled = slot._count.assignments
                          const pct = slot.capacity > 0 ? (filled / slot.capacity) * 100 : 0
                          const isFull = filled >= slot.capacity
                          return (
                            <div key={slot.id} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-foreground">
                                      {slot.startTime} – {slot.endTime}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{slot.branch.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${isFull ? "text-destructive" : "text-primary"}`}>
                                      {filled}/{slot.capacity}
                                    </span>
                                    <DeleteSlotButton trainerId={trainer.id} slotId={slot.id} />
                                  </div>
                                </div>
                                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${isFull ? "bg-destructive" : "bg-primary"}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                {slot.assignments.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {slot.assignments.map((a) => (
                                      <Link key={a.id} href={`/dashboard/members/${a.member.id}`}>
                                        <span className="rounded-full border border-border bg-white px-2 py-0.5 text-xs text-foreground hover:border-primary hover:text-primary">
                                          {a.member.firstName} {a.member.lastName}
                                        </span>
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Assigned members */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Assigned Members</h2>
              <AssignMemberForm
                trainerId={trainer.id}
                branches={trainerBranches.length > 0 ? trainerBranches : branches}
                slots={trainer.trainerSlots.map((s) => ({
                  id: s.id,
                  dayOfWeek: s.dayOfWeek,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  capacity: s.capacity,
                  branch: s.branch,
                  _count: s._count,
                }))}
              />
            </div>

            {trainer.trainerAssign.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">No members assigned yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {trainer.trainerAssign.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <Link href={`/dashboard/members/${a.member.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                        {a.member.firstName} {a.member.lastName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {a.branch.name}
                        {a.slot && ` · ${DAYS[a.slot.dayOfWeek]} ${a.slot.startTime}–${a.slot.endTime}`}
                        {a.member.phone && ` · ${a.member.phone}`}
                      </p>
                    </div>
                    <RemoveAssignmentButton trainerId={trainer.id} assignmentId={a.id} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: info + attendance */}
        <div className="space-y-5">
          {/* Compensation */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Compensation</h2>
            </div>
            <dl className="divide-y divide-border">
              {trainer.employmentType && (
                <div className="flex justify-between px-6 py-3">
                  <dt className="text-xs text-muted-foreground">Type</dt>
                  <dd className="text-sm font-medium text-foreground">{employmentLabel[trainer.employmentType]}</dd>
                </div>
              )}
              {trainer.employmentType === "SALARIED" && trainer.salaryAmount && (
                <div className="flex justify-between px-6 py-3">
                  <dt className="text-xs text-muted-foreground">Monthly Salary</dt>
                  <dd className="font-mono text-sm font-semibold text-foreground">{fmt(Number(trainer.salaryAmount))}</dd>
                </div>
              )}
              {trainer.employmentType === "COMMISSION" && trainer.commissionRate && (
                <>
                  <div className="flex justify-between px-6 py-3">
                    <dt className="text-xs text-muted-foreground">Commission Rate</dt>
                    <dd className="font-mono text-sm font-semibold text-foreground">{Number(trainer.commissionRate)}%</dd>
                  </div>
                  <div className="flex justify-between px-6 py-3">
                    <dt className="text-xs text-muted-foreground">This Month</dt>
                    <dd className="font-mono text-sm font-semibold text-primary">{fmt(earningsThisMonth)}</dd>
                  </div>
                </>
              )}
              {trainer.bio && (
                <div className="px-6 py-3">
                  <dt className="text-xs text-muted-foreground">Bio</dt>
                  <dd className="mt-1 text-sm text-foreground">{trainer.bio}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Branches */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Branches</h2>
            </div>
            {trainerBranches.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">Not assigned to any branch.</p>
            ) : (
              <ul className="divide-y divide-border">
                {trainer.staffBranches.map((sb) => (
                  <li key={sb.branchId} className="flex items-center justify-between px-6 py-3">
                    <Link href={`/dashboard/branches/${sb.branch.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                      {sb.branch.name}
                    </Link>
                    {sb.isPrimary && <span className="text-xs text-primary">Primary</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent attendance */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Recent Check-ins</h2>
            </div>
            {trainer.trainerAttendance.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">No check-ins recorded.</p>
            ) : (
              <ul className="divide-y divide-border">
                {trainer.trainerAttendance.slice(0, 7).map((a) => {
                  const inTime = new Date(a.checkedInAt)
                  const outTime = a.checkedOutAt ? new Date(a.checkedOutAt) : null
                  const hours = outTime
                    ? ((outTime.getTime() - inTime.getTime()) / 3600000).toFixed(1)
                    : null
                  return (
                    <li key={a.id} className="px-6 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-foreground">
                          {inTime.toLocaleDateString("en-PK", { dateStyle: "medium" })}
                        </p>
                        <p className="text-xs text-muted-foreground">{a.branch.name}</p>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground">
                        {inTime.toLocaleTimeString("en-PK", { timeStyle: "short" })}
                        {outTime && ` → ${outTime.toLocaleTimeString("en-PK", { timeStyle: "short" })}`}
                        {hours && ` · ${hours}h`}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
