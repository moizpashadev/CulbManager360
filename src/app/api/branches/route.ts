import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const branches = await prisma.branch.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          members: true,
          staffBranches: true,
          attendance: true,
        },
      },
    },
  })

  return NextResponse.json(branches)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { name, address, phone, email } = body

  if (!name?.trim()) {
    return NextResponse.json({ error: "Branch name is required" }, { status: 400 })
  }

  const branch = await prisma.branch.create({
    data: {
      tenantId: session.tenantId,
      name: name.trim(),
      address: address || null,
      phone: phone || null,
      email: email?.toLowerCase() || null,
    },
  })

  return NextResponse.json(branch, { status: 201 })
}
