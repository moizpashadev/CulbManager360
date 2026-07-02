import { redirect } from "next/navigation"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { NewClassForm } from "./new-class-form"

export default async function NewClassPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  if (!["OWNER", "ADMIN", "MANAGER"].includes(session.role)) redirect("/dashboard/classes")

  const trainers = await prisma.staff.findMany({
    where: { tenantId: session.tenantId, isActive: true, role: { in: ["TRAINER", "ADMIN", "MANAGER", "OWNER"] } },
    select: { id: true, firstName: true, lastName: true, role: true },
    orderBy: { firstName: "asc" },
  })

  return <NewClassForm trainers={trainers} />
}
