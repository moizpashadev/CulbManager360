import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PlanForm } from "../plan-form"

export default function NewPlanPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/plans">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">New Subscription Plan</h1>
          <p className="text-sm text-muted-foreground">Define a plan you can assign to gym clients</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <PlanForm />
      </div>
    </div>
  )
}
