import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import { PlanForm } from "../../plan-form"

export default async function EditPlanPage({ params }: { params: { id: string } }) {
  const plan = await prisma.platformPlan.findUnique({ where: { id: params.id } })
  if (!plan) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/plans">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Edit Plan — {plan.name}</h1>
          <p className="text-sm text-muted-foreground">Changes apply immediately to new assignments</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <PlanForm
          planId={plan.id}
          defaultValues={{
            name: plan.name,
            type: plan.type,
            description: plan.description ?? "",
            oneTimePrice: plan.oneTimePrice != null ? String(plan.oneTimePrice) : "",
            monthlyPrice: plan.monthlyPrice != null ? String(plan.monthlyPrice) : "",
            features: plan.features ?? "",
            isActive: plan.isActive,
            sortOrder: String(plan.sortOrder),
          }}
        />
      </div>
    </div>
  )
}
