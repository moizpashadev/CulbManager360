import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { parseMembersCsv, bulkCreateMembers } from "@/lib/bulk-import-members"

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, props: Params) {
  const params = await props.params
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: params.id }, select: { id: true } })
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  const { csv } = await request.json()
  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "csv is required" }, { status: 400 })
  }

  const { rows, error } = parseMembersCsv(csv)
  if (error) return NextResponse.json({ error }, { status: 400 })
  if (rows.length === 0) return NextResponse.json({ error: "No data rows found" }, { status: 400 })

  const result = await bulkCreateMembers(tenant.id, rows)
  return NextResponse.json(result)
}
