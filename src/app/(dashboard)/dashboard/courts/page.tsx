import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Grid3x3 } from "lucide-react"
import { CourtsClient } from "./courts-client"

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number)
  const ampm = h >= 12 ? "PM" : "AM"
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
}

export default async function CourtsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const courts = await prisma.court.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { bookings: true } } },
  })

  const canManage = ["OWNER", "ADMIN"].includes(session.role)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Courts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {courts.filter((c) => c.isActive).length} active court{courts.filter((c) => c.isActive).length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <CourtsClient
        courts={courts.map((c) => ({
          ...c,
          pricePerSlot: Number(c.pricePerSlot),
          bookingCount: c._count.bookings,
          openTimeFormatted: formatTime(c.openTime),
          closeTimeFormatted: formatTime(c.closeTime),
        }))}
        canManage={canManage}
      />
    </div>
  )
}
