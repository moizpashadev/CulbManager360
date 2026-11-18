import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { parseMembersCsv, bulkCreateMembers } from "@/lib/bulk-import-members"

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role === "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { csv } = await request.json()
  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ error: "csv is required" }, { status: 400 })
  }

  const { rows, error } = parseMembersCsv(csv)
  if (error) return NextResponse.json({ error }, { status: 400 })
  if (rows.length === 0) return NextResponse.json({ error: "No data rows found" }, { status: 400 })

  const result = await bulkCreateMembers(session.tenantId, rows)
  return NextResponse.json(result)
}
