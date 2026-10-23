import { NextRequest, NextResponse } from "next/server"
import { runMemberReminders } from "@/lib/member-reminders"

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runMemberReminders()
  return NextResponse.json(result)
}
