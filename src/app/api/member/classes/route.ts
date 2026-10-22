import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getMemberSession } from "@/lib/member-auth/session"

export async function GET() {
  const session = await getMemberSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: session.sub, status: "ACTIVE" },
    select: { memberId: true, tenantId: true, tenant: { select: { name: true, moduleGym: true } } },
  })
  const gymTenantIds = gymLinks.filter((l) => l.tenant.moduleGym).map((l) => l.tenantId)
  if (gymTenantIds.length === 0) return NextResponse.json({ classes: [] })

  const classes = await prisma.classSchedule.findMany({
    where: { tenantId: { in: gymTenantIds }, isActive: true },
    include: {
      instructor: { select: { firstName: true, lastName: true } },
      tenant: { select: { name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  const memberIdByTenant = new Map(gymLinks.map((l) => [l.tenantId, l.memberId]))

  return NextResponse.json({
    classes: classes.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      capacity: c.capacity,
      instructorName: c.instructor ? `${c.instructor.firstName} ${c.instructor.lastName}` : null,
      gymName: c.tenant.name,
      memberId: memberIdByTenant.get(c.tenantId),
    })),
  })
}
