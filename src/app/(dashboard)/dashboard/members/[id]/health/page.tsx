import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { HealthProfileForm } from "./health-profile-form"
import { ProgressLog } from "./progress-log"

type Props = { params: { id: string } }

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: "Weight Loss",
  MUSCLE_GAIN: "Muscle Gain",
  GENERAL_FITNESS: "General Fitness",
  REHABILITATION: "Rehabilitation",
  ENDURANCE: "Endurance",
  FLEXIBILITY: "Flexibility",
}

export default async function MemberHealthPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const [member, health, entries, trainers] = await Promise.all([
    prisma.member.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
    prisma.memberHealth.findUnique({ where: { memberId: params.id } }),
    prisma.progressEntry.findMany({
      where: { memberId: params.id, tenantId: session.tenantId },
      orderBy: { date: "desc" },
      include: { trainer: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.staff.findMany({
      where: { tenantId: session.tenantId, role: "TRAINER", isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ])

  if (!member) notFound()

  const latestEntry = entries[0] ?? null
  const firstEntry = entries[entries.length - 1] ?? null

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/dashboard/members/${params.id}`}>
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {member.firstName} {member.lastName} — Health & Progress
          </h1>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: Health profile + progress log */}
        <div className="space-y-5 lg:col-span-2">
          {/* Health Profile */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Health Profile</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Initial assessment — medical conditions, goals, starting measurements</p>
            </div>
            <HealthProfileForm
              memberId={params.id}
              defaultValues={health ? {
                height: health.height ? String(health.height) : "",
                initialWeight: health.initialWeight ? String(health.initialWeight) : "",
                bloodGroup: health.bloodGroup ?? "",
                medicalConditions: health.medicalConditions ?? "",
                allergies: health.allergies ?? "",
                goal: health.goal,
                targetWeight: health.targetWeight ? String(health.targetWeight) : "",
                notes: health.notes ?? "",
              } : null}
            />
          </div>

          {/* Progress Log */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-sm font-medium text-foreground">Progress Log</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Weekly check-ins — {entries.length} entr{entries.length === 1 ? "y" : "ies"}
                </p>
              </div>
            </div>
            <ProgressLog memberId={params.id} entries={entries} trainers={trainers} />
          </div>
        </div>

        {/* Right: Summary stats */}
        <div className="space-y-5">
          {/* Goal & Overview */}
          {health && (
            <div className="rounded-lg border border-border bg-white shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-sm font-medium text-foreground">Overview</h2>
              </div>
              <dl className="divide-y divide-border">
                {[
                  { label: "Goal", value: GOAL_LABELS[health.goal] ?? health.goal },
                  { label: "Height", value: health.height ? `${health.height} cm` : "—" },
                  { label: "Starting Weight", value: health.initialWeight ? `${health.initialWeight} kg` : "—" },
                  { label: "Target Weight", value: health.targetWeight ? `${health.targetWeight} kg` : "—" },
                  { label: "Blood Group", value: health.bloodGroup ?? "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between px-6 py-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium text-foreground">{value}</dd>
                  </div>
                ))}
                {health.medicalConditions && (
                  <div className="px-6 py-3">
                    <dt className="text-xs text-muted-foreground">Medical Conditions</dt>
                    <dd className="mt-1 text-sm text-foreground">{health.medicalConditions}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Progress summary */}
          {latestEntry && firstEntry && entries.length > 1 && (
            <div className="rounded-lg border border-border bg-white shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-sm font-medium text-foreground">Progress Summary</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entries.length} check-ins over{" "}
                  {Math.round(
                    (new Date(latestEntry.date).getTime() - new Date(firstEntry.date).getTime()) /
                    (1000 * 60 * 60 * 24 * 7)
                  )}{" "}
                  weeks
                </p>
              </div>
              <div className="divide-y divide-border">
                {latestEntry.weight && firstEntry.weight && (
                  <ProgressDelta
                    label="Weight"
                    unit="kg"
                    from={firstEntry.weight}
                    to={latestEntry.weight}
                    lowerIsBetter={health?.goal === "WEIGHT_LOSS"}
                  />
                )}
                {latestEntry.waist && firstEntry.waist && (
                  <ProgressDelta label="Waist" unit="cm" from={firstEntry.waist} to={latestEntry.waist} lowerIsBetter />
                )}
                {latestEntry.bicep && firstEntry.bicep && (
                  <ProgressDelta label="Bicep" unit="cm" from={firstEntry.bicep} to={latestEntry.bicep} lowerIsBetter={false} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProgressDelta({
  label,
  unit,
  from,
  to,
  lowerIsBetter,
}: {
  label: string
  unit: string
  from: number
  to: number
  lowerIsBetter: boolean
}) {
  const diff = to - from
  const isGood = lowerIsBetter ? diff < 0 : diff > 0
  const sign = diff > 0 ? "+" : ""
  return (
    <div className="flex items-center justify-between px-6 py-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">
          {to} {unit}
        </p>
        {diff !== 0 && (
          <p className={`text-xs font-medium ${isGood ? "text-green-600" : "text-red-500"}`}>
            {sign}{diff.toFixed(1)} {unit}
          </p>
        )}
      </div>
    </div>
  )
}
