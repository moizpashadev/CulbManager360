import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { PlanEditForm } from "./plan-edit-form"

type Props = { params: { id: string } }

export default async function EditPlanPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const plan = await prisma.membershipPlan.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    include: { facilities: { include: { facility: true } } },
  })
  if (!plan) notFound()

  return (
    <div className="max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/plans">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <h1 className="text-xl font-semibold text-foreground">Edit Plan</h1>
      </div>
      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <PlanEditForm
          planId={plan.id}
          defaultValues={{
            name: plan.name,
            description: plan.description ?? "",
            price: String(plan.price),
            durationDays: String(plan.durationDays),
            isActive: plan.isActive,
            priceMode: plan.priceMode as "MANUAL" | "FACILITY_BASED",
            selectedFacilityIds: plan.facilities.map((pf) => pf.facilityId),
          }}
        />
      </div>
    </div>
  )
}
