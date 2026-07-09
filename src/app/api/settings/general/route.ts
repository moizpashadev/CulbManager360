import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { id: true, name: true, moduleGym: true, moduleCourts: true, contactEmail: true, phone: true, whatsappNumber: true, address: true },
  })
  if (!tenant) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(tenant)
}

export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (!["OWNER", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const body = await request.json()
  const { moduleGym, moduleCourts, name, contactEmail, phone, whatsappNumber, address } = body

  // At least one module must stay enabled
  if (moduleGym === false && moduleCourts === false) {
    return NextResponse.json({ error: "At least one module must be enabled" }, { status: 400 })
  }

  const updated = await prisma.tenant.update({
    where: { id: session.tenantId },
    data: {
      ...(moduleGym !== undefined && { moduleGym }),
      ...(moduleCourts !== undefined && { moduleCourts }),
      ...(name && { name: (name as string).trim() }),
      ...(contactEmail !== undefined && { contactEmail: contactEmail || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(whatsappNumber !== undefined && { whatsappNumber: whatsappNumber || null }),
      ...(address !== undefined && { address: address || null }),
    },
    select: { id: true, name: true, moduleGym: true, moduleCourts: true, contactEmail: true, phone: true, whatsappNumber: true, address: true },
  })
  return NextResponse.json(updated)
}
