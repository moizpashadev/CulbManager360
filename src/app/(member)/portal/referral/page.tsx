import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { ReferralLinkCard } from "@/components/referral-link-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MemberPageHeader } from "@/components/member-page-header"
import { Users } from "lucide-react"

export default async function ReferralPage() {
  const session = await getMemberSession()
  if (!session) return null

  const referrals = await prisma.memberAccount.findMany({
    where: { referredByAccountId: session.sub },
    select: { email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  // /me360 is the shareable entry point (redirects to login, carrying ?ref
  // through) rather than linking /member-login directly.
  const referralLink = `${appUrl}/me360?ref=${session.sub}`

  return (
    <div className="space-y-6">
      <MemberPageHeader icon={Users} title="Invite Friends" description="Share your link — track who signs up" />

      <ReferralLinkCard link={referralLink} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Your Referrals ({referrals.length})
          </CardTitle>
          <CardDescription>People who signed up using your link</CardDescription>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No referrals yet.</p>
          ) : (
            <div className="space-y-2">
              {referrals.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{r.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("en-PK")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
