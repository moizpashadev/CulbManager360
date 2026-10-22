import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LogProgressForm } from "@/components/log-progress-form"
import { TrendingUp } from "lucide-react"

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

  const entries = memberIds.length
    ? await prisma.progressEntry.findMany({
        where: { memberId: { in: memberIds } },
        orderBy: { date: "desc" },
        take: 52,
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-muted-foreground">Track your weekly measurements</p>
      </div>

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
