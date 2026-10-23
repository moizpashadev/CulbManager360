import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2, CalendarClock, Wallet, QrCode, CalendarCheck, TrendingUp, ChevronRight,
} from "lucide-react"

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

function daysUntil(date: Date) {
  const ms = new Date(date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.round(ms / 86400000)
}

export default async function PortalPage() {
  const session = await getMemberSession()

  const gymLinks = session
    ? await prisma.memberGymLink.findMany({
        where: { accountId: session.sub },
        include: {
          tenant: { select: { name: true } },
          member: { select: { id: true, firstName: true } },
        },
        orderBy: { joinedAt: "desc" },
      })
    : []

  const memberIds = gymLinks.map((l) => l.memberId)
  const firstName = gymLinks[0]?.member.firstName

  const [activeMembership, unpaidInvoices, nextClass, nextCourt] = memberIds.length
    ? await Promise.all([
        prisma.membership.findFirst({
          where: { memberId: { in: memberIds }, status: "ACTIVE" },
          include: { plan: { select: { name: true } } },
          orderBy: { endDate: "asc" },
        }),
        prisma.invoice.findMany({
          where: { memberId: { in: memberIds }, paymentStatus: { in: ["PENDING", "PARTIAL"] } },
          select: { total: true, paidAmount: true },
        }),
        prisma.classBooking.findFirst({
          where: { memberId: { in: memberIds }, classDate: { gte: new Date() }, status: "CONFIRMED" },
          include: { schedule: { select: { title: true, startTime: true } } },
          orderBy: { classDate: "asc" },
        }),
        prisma.slotBooking.findFirst({
          where: { memberId: { in: memberIds }, bookingDate: { gte: new Date() }, status: "CONFIRMED" },
          include: { court: { select: { name: true } } },
          orderBy: { bookingDate: "asc" },
        }),
      ])
    : [null, [], null, null]

  const outstanding = unpaidInvoices.reduce((sum, inv) => sum + (Number(inv.total) - Number(inv.paidAmount)), 0)

  // Whichever of the next class/court booking is sooner.
  const nextBooking =
    nextClass && (!nextCourt || nextClass.classDate <= nextCourt.bookingDate)
      ? { label: nextClass.schedule.title, date: nextClass.classDate, time: nextClass.schedule.startTime, href: "/portal/classes" }
      : nextCourt
      ? { label: nextCourt.court.name, date: nextCourt.bookingDate, time: nextCourt.startTime, href: "/portal/courts" }
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {firstName ? `Hi, ${firstName}` : "Welcome"}
        </h1>
        <p className="text-sm text-muted-foreground">{session?.email}</p>
      </div>

      {gymLinks.length > 0 && (
        <>
          {/* At-a-glance stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="py-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5" />
                  Outstanding
                </div>
                <p className={`font-mono text-lg font-semibold ${outstanding > 0 ? "text-foreground" : "text-primary"}`}>
                  {outstanding > 0 ? fmt(outstanding) : "All paid"}
                </p>
                {outstanding > 0 && (
                  <Link href="/portal/invoices" className="text-xs text-primary hover:underline">
                    View & pay
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Membership
                </div>
                {activeMembership ? (
                  <>
                    <p className="text-sm font-semibold leading-tight">{activeMembership.plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {daysUntil(activeMembership.endDate) >= 0
                        ? `${daysUntil(activeMembership.endDate)} days left`
                        : "Expired"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No active plan</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Next booking */}
          {nextBooking && (
            <Link href={nextBooking.href}>
              <Card className="border-primary/20 bg-primary/5 transition-colors hover:bg-primary/10">
                <CardContent className="flex items-center gap-3 py-4">
                  <CalendarCheck className="h-5 w-5 shrink-0 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{nextBooking.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(nextBooking.date).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}{nextBooking.time}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/portal/checkin", label: "Check-in", icon: QrCode },
              { href: "/portal/book", label: "Book", icon: CalendarCheck },
              { href: "/portal/progress", label: "Log Progress", icon: TrendingUp },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Card className="transition-colors hover:border-primary/40 hover:bg-primary/5">
                  <CardContent className="flex flex-col items-center gap-1.5 py-4 text-center">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium">{label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Your gyms */}
      <Card>
        <CardContent className="py-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Your Gyms
          </div>
          {gymLinks.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You&apos;re not linked to a gym yet. Ask your gym&apos;s front desk to add you by this email,
                or find one yourself.
              </p>
              <Link href="/portal/find-gym" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Find your gym <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {gymLinks.map((link) => (
                <div key={link.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{link.tenant.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {new Date(link.joinedAt).toLocaleDateString("en-PK")}
                      {link.leftAt ? ` · Left ${new Date(link.leftAt).toLocaleDateString("en-PK")}` : ""}
                    </p>
                  </div>
                  <Badge variant={link.status === "ACTIVE" ? "default" : "secondary"}>{link.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
