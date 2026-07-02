import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const health = await prisma.memberHealth.findUnique({
    where: { memberId: params.id },
  })

  return NextResponse.json(health ?? null)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const member = await prisma.member.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
  })
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { height, initialWeight, bloodGroup, medicalConditions, allergies, goal, targetWeight, notes } = body

  const health = await prisma.memberHealth.upsert({
    where: { memberId: params.id },
    create: {
      memberId: params.id,
      height: height ? parseFloat(height) : null,
      initialWeight: initialWeight ? parseFloat(initialWeight) : null,
      bloodGroup: bloodGroup || null,
      medicalConditions: medicalConditions || null,
      allergies: allergies || null,
      goal: goal || "GENERAL_FITNESS",
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
      notes: notes || null,
    },
    update: {
      height: height ? parseFloat(height) : null,
      initialWeight: initialWeight ? parseFloat(initialWeight) : null,
      bloodGroup: bloodGroup || null,
      medicalConditions: medicalConditions || null,
      allergies: allergies || null,
      goal: goal || "GENERAL_FITNESS",
      targetWeight: targetWeight ? parseFloat(targetWeight) : null,
      notes: notes || null,
    },
  })

  return NextResponse.json(health)
}
