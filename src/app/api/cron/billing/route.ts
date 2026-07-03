import { NextRequest, NextResponse } from "next/server"
import { runBillingCycle } from "@/lib/billing"

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runBillingCycle()
  return NextResponse.json(result)
}
