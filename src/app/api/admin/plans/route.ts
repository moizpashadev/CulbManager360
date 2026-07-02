import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { name, type, description, oneTimePrice, monthlyPrice, features, isActive, sortOrder } = body

  if (!name || !type) {
    return NextResponse.json({ error: "name and type are required" }, { status: 400 })
  }

  const plan = await prisma.platformPlan.create({
    data: {
      name,
      type,
      description: description ?? null,
      oneTimePrice: oneTimePrice != null ? oneTimePrice : null,
      monthlyPrice: monthlyPrice != null ? monthlyPrice : null,
      features: features ?? null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    },
  })

  return NextResponse.json(plan, { status: 201 })
}
