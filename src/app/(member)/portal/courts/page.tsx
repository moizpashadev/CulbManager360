import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookCourtButton } from "@/components/book-court-button"
import { MemberPageHeader } from "@/components/member-page-header"
import { Grid3x3 } from "lucide-react"

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

export default async function PortalCourtsPage() {
  const session = await getMemberSession()
  if (!session) return null

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: session.sub, status: "ACTIVE" },
    select: { tenantId: true, tenant: { select: { moduleCourts: true } } },
  })
  const courtTenantIds = gymLinks.filter((l) => l.tenant.moduleCourts).map((l) => l.tenantId)

  const courts = courtTenantIds.length
    ? await prisma.court.findMany({
        where: { tenantId: { in: courtTenantIds }, isActive: true },
        include: { tenant: { select: { name: true } } },
        orderBy: { name: "asc" },
      })
    : []

  return (
    <div className="space-y-6">
      <MemberPageHeader icon={Grid3x3} title="Courts" description="Book a time slot" />

      {courts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No courts available.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courts.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                      {c.name}
                      {c.sport && <span className="text-xs font-normal text-muted-foreground">({c.sport})</span>}
                    </CardTitle>
                    <CardDescription>
                      {c.tenant.name} · {c.openTime}–{c.closeTime} · {fmt(c.pricePerSlot)} / {c.slotDuration}min
                    </CardDescription>
                  </div>
                  <BookCourtButton
                    courtId={c.id}
                    openTime={c.openTime}
                    closeTime={c.closeTime}
                    slotDuration={c.slotDuration}
                  />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
