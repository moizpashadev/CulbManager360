import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

const MIN_MINUTES_BEFORE_CHECKOUT = 5

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { memberId } = await request.json()
  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 })
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: session.tenantId },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const openRecord = await prisma.attendance.findFirst({
    where: { memberId, tenantId: session.tenantId, checkedInAt: { gte: today }, checkedOutAt: null },
  })

  // ── No open record → this scan is a check-in ────────────────────────────
  if (!openRecord) {
    const now = new Date()
    const activeMembership = member.memberships[0]
    let warning: string | null = null
    if (!activeMembership) {
      warning = "No active membership — member has no assigned plan."
    } else if (new Date(activeMembership.endDate) < now) {
      warning = `Membership expired on ${new Date(activeMembership.endDate).toLocaleDateString("en-PK")} — renew to continue access.`
    }

    const record = await prisma.attendance.create({
      data: { memberId, tenantId: session.tenantId, method: "QR_CODE" },
      include: { member: { select: { id: true, firstName: true, lastName: true } } },
    })

    return NextResponse.json({ action: "check-in", ...record, warning }, { status: 201 })
  }

  // ── Open record exists → this scan is a check-out attempt ───────────────
  const minutesSinceCheckIn = (Date.now() - openRecord.checkedInAt.getTime()) / 60000

  if (minutesSinceCheckIn < MIN_MINUTES_BEFORE_CHECKOUT) {
    const waitMore = Math.ceil(MIN_MINUTES_BEFORE_CHECKOUT - minutesSinceCheckIn)
    return NextResponse.json(
      {
        error: `Checked in ${Math.floor(minutesSinceCheckIn)}m ago — wait ${waitMore} more minute${waitMore === 1 ? "" : "s"} before checking out.`,
      },
      { status: 409 }
    )
  }

  const updated = await prisma.attendance.update({
    where: { id: openRecord.id },
    data: { checkedOutAt: new Date() },
    include: { member: { select: { id: true, firstName: true, lastName: true } } },
  })

  return NextResponse.json({ action: "check-out", ...updated }, { status: 200 })
}
