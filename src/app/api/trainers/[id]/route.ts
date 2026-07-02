import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  const trainer = await prisma.staff.findFirst({
    where: { id: params.id, tenantId: session.tenantId, role: "TRAINER" },
    include: {
      staffBranches: {
        include: { branch: true },
      },
      trainerSlots: {
        where: { isActive: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        include: {
          branch: { select: { id: true, name: true } },
          assignments: {
            where: { status: "ACTIVE" },
            include: {
              member: { select: { id: true, firstName: true, lastName: true } },
            },
          },
        },
      },
      trainerAssign: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        include: {
          member: { select: { id: true, firstName: true, lastName: true, email: true } },
          branch: { select: { id: true, name: true } },
          slot: { select: { dayOfWeek: true, startTime: true, endTime: true } },
        },
      },
      trainerAttendance: {
        orderBy: { checkedInAt: "desc" },
        take: 30,
        include: { branch: { select: { id: true, name: true } } },
      },
    },
  })

  if (!trainer) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })

  // Calculate earnings this month
  let earningsThisMonth = 0
  if (trainer.employmentType === "SALARIED" && trainer.salaryAmount) {
    earningsThisMonth = Number(trainer.salaryAmount)
  } else if (trainer.employmentType === "COMMISSION" && trainer.commissionRate) {
    // Sum paid invoices for members assigned to this trainer this month
    const memberIds = trainer.trainerAssign.map((a) => a.memberId)
    const revenue = await prisma.invoice.aggregate({
      where: {
        tenantId: session.tenantId,
        memberId: { in: memberIds },
        paymentStatus: "PAID",
        createdAt: { gte: monthStart },
      },
      _sum: { total: true },
    })
    const totalRevenue = Number(revenue._sum.total ?? 0)
    earningsThisMonth = (totalRevenue * Number(trainer.commissionRate)) / 100
  }

  // Today's attendance for this trainer
  const todayAttendance = trainer.trainerAttendance.find((a) => {
    const d = new Date(a.checkedInAt)
    return d >= today && d < tomorrow
  })

  return NextResponse.json({ ...trainer, earningsThisMonth, todayAttendance: todayAttendance ?? null })
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const existing = await prisma.staff.findFirst({
    where: { id: params.id, tenantId: session.tenantId, role: "TRAINER" },
  })
  if (!existing) return NextResponse.json({ error: "Trainer not found" }, { status: 404 })

  const body = await request.json()
  const { firstName, lastName, email, employmentType, salaryAmount, commissionRate, specialization, bio, isActive, branchIds } = body

  const updated = await prisma.staff.update({
    where: { id: params.id },
    data: {
      firstName: firstName ?? existing.firstName,
      lastName: lastName ?? existing.lastName,
      email: email ? (email as string).toLowerCase().trim() : existing.email,
      employmentType: employmentType !== undefined ? (employmentType || null) : existing.employmentType,
      salaryAmount: salaryAmount !== undefined ? (salaryAmount ? parseFloat(salaryAmount) : null) : existing.salaryAmount,
      commissionRate: commissionRate !== undefined ? (commissionRate ? parseFloat(commissionRate) : null) : existing.commissionRate,
      specialization: specialization !== undefined ? (specialization || null) : existing.specialization,
      bio: bio !== undefined ? (bio || null) : existing.bio,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    },
  })

  // Update branch assignments if provided
  if (branchIds !== undefined) {
    await prisma.staffBranch.deleteMany({ where: { staffId: params.id } })
    if ((branchIds as string[]).length > 0) {
      await prisma.staffBranch.createMany({
        data: (branchIds as string[]).map((bid: string, i: number) => ({
          staffId: params.id,
          branchId: bid,
          isPrimary: i === 0,
        })),
      })
    }
  }

  return NextResponse.json(updated)
}
