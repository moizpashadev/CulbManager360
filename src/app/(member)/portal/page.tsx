import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2 } from "lucide-react"

export default async function PortalPage() {
  const session = await getMemberSession()

  const gymLinks = session
    ? await prisma.memberGymLink.findMany({
        where: { accountId: session.sub },
        include: { tenant: { select: { name: true } } },
        orderBy: { joinedAt: "desc" },
      })
    : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
        <p className="text-sm text-muted-foreground">{session?.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Your Gyms
          </CardTitle>
          <CardDescription>
            {gymLinks.length === 0
              ? "You're not linked to a gym yet. Ask your gym's front desk to add you by this email."
              : "Gyms you're a member of, current and past."}
          </CardDescription>
        </CardHeader>
        {gymLinks.length > 0 && (
          <CardContent className="space-y-2">
            {gymLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{link.tenant.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(link.joinedAt).toLocaleDateString()}
                    {link.leftAt ? ` · Left ${new Date(link.leftAt).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <Badge variant={link.status === "ACTIVE" ? "default" : "secondary"}>
                  {link.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
