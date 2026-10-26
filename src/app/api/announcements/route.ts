import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { sendPushToAccount } from "@/lib/member-auth/send-push"

const SENDER_ROLES = ["OWNER", "ADMIN", "MANAGER"]

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const announcements = await prisma.announcement.findMany({
    where: { tenantId: session.tenantId },
    include: { createdByStaff: { select: { firstName: true, lastName: true } }, branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
  return NextResponse.json(announcements)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!SENDER_ROLES.includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const { title, message, audience, branchId } = body

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }
  if (!["ALL", "EXPIRING_SOON", "OUTSTANDING_PAYMENT", "BRANCH"].includes(audience)) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 })
  }
  if (audience === "BRANCH" && !branchId) {
    return NextResponse.json({ error: "branchId is required for a branch-targeted announcement" }, { status: 400 })
  }

  const tenantId = session.tenantId
  let memberIds: string[]

  if (audience === "ALL") {
    const members = await prisma.member.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { id: true },
    })
    memberIds = members.map((m) => m.id)
  } else if (audience === "BRANCH") {
    const members = await prisma.member.findMany({
      where: { tenantId, status: "ACTIVE", branchId },
      select: { id: true },
    })
    memberIds = members.map((m) => m.id)
  } else if (audience === "EXPIRING_SOON") {
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const memberships = await prisma.membership.findMany({
      where: {
        status: "ACTIVE",
        endDate: { gte: new Date(), lte: in7Days },
        member: { tenantId, status: "ACTIVE" },
      },
      select: { memberId: true },
    })
    memberIds = [...new Set(memberships.map((m) => m.memberId))]
  } else {
    // OUTSTANDING_PAYMENT
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        paymentStatus: { in: ["PENDING", "PARTIAL"] },
        memberId: { not: null },
      },
      select: { memberId: true },
    })
    memberIds = [...new Set(invoices.map((i) => i.memberId).filter((id): id is string => id !== null))]
  }

  const gymLinks = memberIds.length
    ? await prisma.memberGymLink.findMany({
        where: { tenantId, memberId: { in: memberIds }, status: "ACTIVE" },
        select: { accountId: true },
      })
    : []
  const accountIds = [...new Set(gymLinks.map((l) => l.accountId))]

  let sentCount = 0
  if (accountIds.length > 0) {
    const subs = await prisma.memberPushSubscription.findMany({
      where: { accountId: { in: accountIds } },
      select: { accountId: true },
      distinct: ["accountId"],
    })
    const reachableAccountIds = new Set(subs.map((s) => s.accountId))
    sentCount = reachableAccountIds.size

    await Promise.all(
      [...reachableAccountIds].map((accountId) =>
        sendPushToAccount(accountId, { title: title.trim(), body: message.trim(), url: "/portal" })
      )
    )
  }

  const announcement = await prisma.announcement.create({
    data: {
      tenantId,
      title: title.trim(),
      body: message.trim(),
      audience,
      branchId: audience === "BRANCH" ? branchId : null,
      recipientCount: memberIds.length,
      sentCount,
      createdByStaffId: session.sub,
    },
  })

  return NextResponse.json({ ok: true, announcement, recipientCount: memberIds.length, sentCount })
}
