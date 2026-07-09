import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { hashPassword } from "@/lib/auth/password"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { members: true, staff: true } } },
  })
  return NextResponse.json(tenants)
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { gymName, slug, contactEmail, phone, whatsappNumber, address, ownerFirstName, ownerLastName, ownerEmail, ownerPassword, moduleGym, moduleCourts } = body

  if (!gymName || !slug || !ownerFirstName || !ownerLastName || !ownerEmail || !ownerPassword) {
    return NextResponse.json({ error: "All required fields must be filled" }, { status: 400 })
  }

  if ((ownerPassword as string).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const slugPattern = /^[a-z0-9-]+$/
  if (!slugPattern.test(slug)) {
    return NextResponse.json({ error: "Slug must contain only lowercase letters, numbers, and hyphens" }, { status: 400 })
  }

  try {
    const passwordHash = await hashPassword(ownerPassword)

    // Create tenant + owner in a single transaction
    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          name: gymName,
          slug,
          contactEmail: contactEmail ?? null,
          phone: phone ?? null,
          whatsappNumber: whatsappNumber ?? null,
          address: address ?? null,
          moduleGym: moduleGym !== false,
          moduleCourts: moduleCourts === true,
        },
      })

      await tx.staff.create({
        data: {
          tenantId: t.id,
          firstName: ownerFirstName,
          lastName: ownerLastName,
          email: (ownerEmail as string).toLowerCase(),
          passwordHash,
          role: "OWNER",
        },
      })

      return t
    })

    return NextResponse.json(tenant, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : ""
    if (message.includes("Unique constraint") || message.includes("unique")) {
      return NextResponse.json({ error: "Slug already taken. Choose a different URL slug." }, { status: 409 })
    }
    return NextResponse.json({ error: "Failed to create gym" }, { status: 500 })
  }
}
