import { redirect } from "next/navigation"
import Link from "next/link"
import { getSession } from "@/lib/auth/session"
import { ArrowLeft } from "lucide-react"
import { ScanWidget } from "@/components/scan-widget"

export default async function ScanCheckInPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/attendance">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Scan Check-in / Check-out</h1>
          <p className="text-sm text-muted-foreground">USB QR/barcode scanner — first scan checks in, next scan (after 5 min) checks out</p>
        </div>
      </div>

      <ScanWidget />
    </div>
  )
}
