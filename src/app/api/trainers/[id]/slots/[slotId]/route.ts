import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

type Params = { params: { id: string; slotId: string } }

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const slot = await prisma.trainerSlot.findFirst({
    where: { id: params.slotId, trainerId: params.id },
    include: { _count: { select: { assignments: { where: { status: "ACTIVE" } } } } },
  })
  if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 })

  if (slot._count.assignments > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${slot._count.assignments} active member(s) assigned to this slot` },
      { status: 409 }
    )
  }

  await prisma.trainerSlot.update({
    where: { id: params.slotId },
    data: { isActive: false },
  })

  return NextResponse.json({ ok: true })
}
