import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookClassButton } from "@/components/book-class-button"
import { Calendar } from "lucide-react"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default async function PortalClassesPage() {
  const session = await getMemberSession()
  if (!session) return null

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: session.sub, status: "ACTIVE" },
    select: { tenantId: true, tenant: { select: { moduleGym: true } } },
  })
  const gymTenantIds = gymLinks.filter((l) => l.tenant.moduleGym).map((l) => l.tenantId)

  const classes = gymTenantIds.length
    ? await prisma.classSchedule.findMany({
        where: { tenantId: { in: gymTenantIds }, isActive: true },
        include: {
          instructor: { select: { firstName: true, lastName: true } },
          tenant: { select: { name: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
        <p className="text-sm text-muted-foreground">Book a spot in an upcoming class</p>
      </div>

      {classes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No classes available.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {c.title}
                    </CardTitle>
                    <CardDescription>
                      {c.tenant.name} · {DAY_NAMES[c.dayOfWeek]}s, {c.startTime}–{c.endTime}
                      {c.instructor && ` · ${c.instructor.firstName} ${c.instructor.lastName}`}
                    </CardDescription>
                  </div>
                  <BookClassButton classId={c.id} dayOfWeek={c.dayOfWeek} />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
