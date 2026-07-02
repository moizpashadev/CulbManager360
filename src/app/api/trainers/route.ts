import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { hashPassword } from "@/lib/auth/password"

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const trainers = await prisma.staff.findMany({
    where: { tenantId: session.tenantId, role: "TRAINER" },
    orderBy: { firstName: "asc" },
    include: {
      staffBranches: {
        include: { branch: { select: { id: true, name: true } } },
      },
      trainerSlots: {
        where: { isActive: true },
        include: {
          _count: { select: { assignments: { where: { status: "ACTIVE" } } } },
        },
      },
      trainerAssign: {
        where: { status: "ACTIVE" },
        select: { id: true },
      },
    },
  })

  return NextResponse.json(trainers)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    firstName, lastName, email, password,
    employmentType, salaryAmount, commissionRate,
    specialization, bio, branchIds = [],
  } = body

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "firstName, lastName, email, password required" }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)

  try {
    const trainer = await prisma.staff.create({
      data: {
        tenantId: session.tenantId,
        firstName,
        lastName,
        email: (email as string).toLowerCase().trim(),
        passwordHash,
        role: "TRAINER",
        employmentType: employmentType || null,
        salaryAmount: salaryAmount ? parseFloat(salaryAmount) : null,
        commissionRate: commissionRate ? parseFloat(commissionRate) : null,
        specialization: specialization || null,
        bio: bio || null,
        staffBranches: {
          create: (branchIds as string[]).map((bid, i) => ({
            branchId: bid,
            isPrimary: i === 0,
          })),
        },
      },
      include: {
        staffBranches: { include: { branch: { select: { id: true, name: true } } } },
      },
    })
    return NextResponse.json(trainer, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
  }
}
