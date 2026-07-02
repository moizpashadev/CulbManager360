import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const dateStr = searchParams.get("date")

  const date = dateStr ? new Date(dateStr) : new Date()
  date.setHours(0, 0, 0, 0)
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)

  const records = await prisma.attendance.findMany({
    where: {
      tenantId: session.tenantId,
      checkedInAt: { gte: date, lt: nextDay },
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { checkedInAt: "desc" },
  })

  return NextResponse.json(records)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { memberId, method } = body

  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 })
  }

  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId: session.tenantId },
    include: {
      memberships: {
        where: { status: "ACTIVE" },
        include: { plan: { select: { name: true } } },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  // Check for active valid membership
  const now = new Date()
  const activeMembership = member.memberships[0]
  let membershipWarning: string | null = null

  if (!activeMembership) {
    membershipWarning = "No active membership — member has no assigned plan."
  } else if (new Date(activeMembership.endDate) < now) {
    membershipWarning = `Membership expired on ${new Date(activeMembership.endDate).toLocaleDateString("en-PK")} — renew to continue access.`
  }

  // Prevent duplicate open check-in
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const existing = await prisma.attendance.findFirst({
    where: {
      memberId,
      tenantId: session.tenantId,
      checkedInAt: { gte: today },
      checkedOutAt: null,
    },
  })
  if (existing) {
    return NextResponse.json({ error: "Member already checked in — check them out first" }, { status: 409 })
  }

  const record = await prisma.attendance.create({
    data: {
      memberId,
      tenantId: session.tenantId,
      method: method ?? "MANUAL",
    },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })

  return NextResponse.json({ ...record, warning: membershipWarning }, { status: 201 })
}
