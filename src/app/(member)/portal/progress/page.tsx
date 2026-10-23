import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LogProgressForm } from "@/components/log-progress-form"
import { WeightProgressChart } from "@/components/charts/weight-progress-chart"
import { MemberPageHeader } from "@/components/member-page-header"
import { TrendingUp, Target } from "lucide-react"

const GOAL_LABELS: Record<string, string> = {
  WEIGHT_LOSS: "Weight Loss",
  MUSCLE_GAIN: "Muscle Gain",
  GENERAL_FITNESS: "General Fitness",
  REHABILITATION: "Rehabilitation",
  ENDURANCE: "Endurance",
  FLEXIBILITY: "Flexibility",
}

const FIELDS = [
  { key: "weight", label: "Weight", unit: "kg" },
  { key: "chest", label: "Chest", unit: "in" },
  { key: "waist", label: "Waist", unit: "in" },
  { key: "hips", label: "Hips", unit: "in" },
  { key: "bicep", label: "Bicep", unit: "in" },
  { key: "thigh", label: "Thigh", unit: "in" },
  { key: "shoulders", label: "Shoulders", unit: "in" },
] as const

export default async function PortalProgressPage() {
  const session = await getMemberSession()
  if (!session) return null

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: session.sub, status: "ACTIVE" },
    select: { memberId: true, tenantId: true, tenant: { select: { name: true } } },
  })
  const gyms = gymLinks.map((l) => ({ tenantId: l.tenantId, gymName: l.tenant.name }))
  const memberIds = gymLinks.map((l) => l.memberId)
  const tenantByMemberId = new Map(gymLinks.map((l) => [l.memberId, l.tenant.name]))

  const [entries, healthProfiles] = memberIds.length
    ? await Promise.all([
        prisma.progressEntry.findMany({
          where: { memberId: { in: memberIds } },
          orderBy: { date: "desc" },
          take: 52,
        }),
        prisma.memberHealth.findMany({ where: { memberId: { in: memberIds } } }),
      ])
    : [[], []]

  // Single-gym case covers the vast majority of members — show the chart
  // against the first (most recently joined) gym's goal/target.
  const primaryHealth = healthProfiles[0]
  const chartData = entries
    .filter((e) => e.weight != null && (!primaryHealth || e.memberId === primaryHealth.memberId))
    .slice()
    .reverse()
    .map((e) => ({ date: new Date(e.date).toLocaleDateString("en-PK", { day: "numeric", month: "short" }), weight: e.weight as number }))

  return (
    <div className="space-y-6">
      <MemberPageHeader icon={TrendingUp} title="Progress" description="Track your weekly measurements" />

      {gyms.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You&apos;re not linked to a gym yet, so there&apos;s nothing to track progress against.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Log today&apos;s measurements</CardTitle>
              <CardDescription>Leave anything blank you don&apos;t want to track</CardDescription>
            </CardHeader>
            <CardContent>
              <LogProgressForm gyms={gyms} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                Weight Trend
              </CardTitle>
              {primaryHealth?.goal && (
                <CardDescription className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" />
                  Goal: {GOAL_LABELS[primaryHealth.goal] ?? primaryHealth.goal}
                  {primaryHealth.targetWeight != null && ` · Target ${primaryHealth.targetWeight}kg`}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <WeightProgressChart data={chartData} targetWeight={primaryHealth?.targetWeight} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No entries yet.</p>
              ) : (
                <div className="space-y-2">
                  {entries.map((e) => (
                    <div key={e.id} className="rounded-md border px-3 py-2 text-sm">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">
                          {new Date(e.date).toLocaleDateString("en-PK")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tenantByMemberId.get(e.memberId)}
                          {e.trainerId ? " · logged by trainer" : " · self-logged"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {FIELDS.map(
                          (f) =>
                            e[f.key] != null && (
                              <span key={f.key}>
                                {f.label}: <span className="font-medium text-foreground">{e[f.key]}{f.unit}</span>
                              </span>
                            )
                        )}
                      </div>
                      {e.notes && <p className="mt-1 text-xs text-muted-foreground">{e.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
