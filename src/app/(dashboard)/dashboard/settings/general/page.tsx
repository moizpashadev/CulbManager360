import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { GeneralSettingsForm } from "./general-settings-form"

export default async function GeneralSettingsPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!["OWNER", "ADMIN"].includes(session.role)) redirect("/dashboard")

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true, contactEmail: true, phone: true, address: true, moduleGym: true, moduleCourts: true },
  })
  if (!tenant) redirect("/dashboard")

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">General Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Configure your club profile and active modules
        </p>
      </div>

      <GeneralSettingsForm defaultValues={tenant} />
    </div>
  )
}
