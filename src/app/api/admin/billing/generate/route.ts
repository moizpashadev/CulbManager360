import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { runBillingCycle } from "@/lib/billing"

export async function POST() {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runBillingCycle()
  return NextResponse.json(result)
}
