import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { StaffEditForm } from "./staff-edit-form"

type Props = { params: { id: string } }

export default async function EditStaffPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!["OWNER", "ADMIN"].includes(session.role)) redirect("/dashboard/staff")

  const staff = await prisma.staff.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true },
  })
  if (!staff) notFound()

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/staff">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Edit Staff Member</h1>
      </div>
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="mb-4 rounded bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          Email: <span className="font-mono font-medium text-foreground">{staff.email}</span>
        </div>
        <StaffEditForm
          staffId={staff.id}
          defaultValues={{
            firstName: staff.firstName,
            lastName: staff.lastName,
            role: staff.role,
            isActive: staff.isActive,
          }}
          isOwnerAccount={staff.role === "OWNER"}
        />
      </div>
    </div>
  )
}
