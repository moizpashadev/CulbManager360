import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MemberPageHeader } from "@/components/member-page-header"
import { QrCode } from "lucide-react"

export default async function PortalCheckinPage() {
  const session = await getMemberSession()
  if (!session) return null

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: session.sub, status: "ACTIVE" },
    select: { memberId: true, tenant: { select: { name: true } } },
  })

  return (
    <div className="space-y-6">
      <MemberPageHeader icon={QrCode} title="Check-in" description="Show this to the front desk to check in" />

      {gymLinks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You&apos;re not linked to a gym yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {gymLinks.map((link) => (
            <Card key={link.memberId}>
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-sm">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  {link.tenant.name}
                </CardTitle>
                <CardDescription>Scan at the front desk</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/members/${link.memberId}/qr`}
                  alt={`Check-in QR code for ${link.tenant.name}`}
                  width={220}
                  height={220}
                  className="rounded-lg border"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
