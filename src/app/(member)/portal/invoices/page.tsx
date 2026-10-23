import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MemberPageHeader } from "@/components/member-page-header"
import { Receipt } from "lucide-react"

const paymentColors: Record<string, "success" | "warning" | "secondary"> = {
  PAID: "success", PENDING: "warning", PARTIAL: "warning", WAIVED: "secondary",
}

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

export default async function PortalInvoicesPage() {
  const session = await getMemberSession()
  if (!session) return null

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: session.sub },
    select: { memberId: true, tenant: { select: { name: true, kuickpayInstitutionId: true } } },
  })
  const tenantByMemberId = new Map(gymLinks.map((l) => [l.memberId, l.tenant]))
  const memberIds = gymLinks.map((l) => l.memberId)

  const invoices = memberIds.length
    ? await prisma.invoice.findMany({
        where: { memberId: { in: memberIds } },
        include: { member: { select: { id: true, consumerNumber: true } } },
        orderBy: { createdAt: "desc" },
      })
    : []

  return (
    <div className="space-y-6">
      <MemberPageHeader icon={Receipt} title="Invoices" description="Your billing history across all gyms" />

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No invoices yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => {
            const tenant = tenantByMemberId.get(inv.memberId!)
            const outstanding = Number(inv.total) - Number(inv.paidAmount)
            const unpaid = inv.paymentStatus === "PENDING" || inv.paymentStatus === "PARTIAL"
            return (
              <Card key={inv.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        {inv.type.replace(/_/g, " ")}
                        {inv.description ? ` — ${inv.description}` : ""}
                      </CardTitle>
                      <CardDescription>
                        {tenant?.name} ·{" "}
                        {new Date(inv.createdAt).toLocaleDateString("en-PK")}
                        {inv.dueDate && ` · Due ${new Date(inv.dueDate).toLocaleDateString("en-PK")}`}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">{fmt(inv.total)}</p>
                      <Badge variant={paymentColors[inv.paymentStatus] ?? "secondary"}>
                        {inv.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {unpaid && inv.member?.consumerNumber && (
                  <CardContent className="pt-0">
                    <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-xs">
                      <p className="font-medium text-foreground">
                        Pay {fmt(outstanding)} via KuickPay
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Go to any bank&apos;s ATM, mobile app, or branch, choose &quot;KuickPay&quot; /
                        bill payment, and enter consumer number{" "}
                        <span className="select-all font-mono font-semibold text-foreground">
                          {inv.member.consumerNumber}
                        </span>
                        . Your invoice updates automatically once the bank confirms payment —
                        no need to tell us.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
