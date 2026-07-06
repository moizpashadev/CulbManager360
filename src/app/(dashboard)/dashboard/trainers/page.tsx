import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { Plus, Dumbbell } from "lucide-react"
import { GridSearch } from "@/components/grid-search"
import { Suspense } from "react"

const employmentBadge: Record<string, "success" | "warning" | "secondary"> = {
  SALARIED: "success",
  COMMISSION: "warning",
  SELF_EMPLOYED: "secondary",
}

export default async function TrainersPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { q } = searchParams

  const where: Record<string, unknown> = { tenantId: session.tenantId, role: "TRAINER" }
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { specialization: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ]
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  const trainers = await prisma.staff.findMany({
    where,
    orderBy: { firstName: "asc" },
    include: {
      staffBranches: { include: { branch: { select: { id: true, name: true } } } },
      trainerSlots: {
        where: { isActive: true },
        include: { _count: { select: { assignments: { where: { status: "ACTIVE" } } } } },
      },
      trainerAssign: { where: { status: "ACTIVE" }, select: { id: true } },
      trainerAttendance: {
        where: { checkedInAt: { gte: today } },
        take: 1,
        select: { id: true, checkedOutAt: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Trainers</h1>
          <p className="text-sm text-muted-foreground">
            {trainers.length} trainer{trainers.length !== 1 ? "s" : ""}
            {q ? ` matching "${q}"` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Suspense>
            <GridSearch placeholder="Search trainers…" basePath="/dashboard/trainers" />
          </Suspense>
          <Link
            href="/dashboard/trainers/new"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Trainer
          </Link>
        </div>
      </div>

      {trainers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-white px-8 py-16 text-center shadow-sm">
          <Dumbbell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-foreground">
            {q ? `No trainers match "${q}"` : "No trainers yet"}
          </p>
          {!q && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Add trainers to start assigning members and managing schedules.</p>
              <Link
                href="/dashboard/trainers/new"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Add Trainer
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {trainers.map((trainer) => {
            const branches = trainer.staffBranches.map((sb) => sb.branch)
            const todaySlots = trainer.trainerSlots.filter((s) => s.dayOfWeek === todayIdx)
            const totalCapacity = todaySlots.reduce((s, sl) => s + sl.capacity, 0)
            const filledSlots = todaySlots.reduce((s, sl) => s + sl._count.assignments, 0)
            const freeSlots = totalCapacity - filledSlots
            const checkedInToday = trainer.trainerAttendance[0]
            const isCheckedIn = checkedInToday && !checkedInToday.checkedOutAt

            return (
              <Link
                key={trainer.id}
                href={`/dashboard/trainers/${trainer.id}`}
                className="rounded-lg border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {trainer.firstName} {trainer.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {trainer.specialization ?? "General Trainer"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCheckedIn && (
                      <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" /> In
                      </span>
                    )}
                    {trainer.employmentType && (
                      <Badge variant={employmentBadge[trainer.employmentType]}>
                        {trainer.employmentType === "SELF_EMPLOYED"
                          ? "Self-Emp"
                          : trainer.employmentType.charAt(0) + trainer.employmentType.slice(1).toLowerCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                {branches.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1">
                    {branches.map((b) => (
                      <span key={b.id} className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                        {b.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{trainer.trainerAssign.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Slots Today</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{todaySlots.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Free Today</p>
                    <p className={`mt-0.5 text-lg font-bold tabular-nums ${freeSlots > 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {totalCapacity > 0 ? freeSlots : "—"}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
