import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Pencil } from "lucide-react"

const typeLabels: Record<string, string> = {
  OFFLINE: "Offline / Local",
  SELF_HOSTED: "Self-Hosted Online",
  SAAS: "Cloud SaaS",
}

const typeColors: Record<string, "secondary" | "warning" | "success"> = {
  OFFLINE: "secondary",
  SELF_HOSTED: "warning",
  SAAS: "success",
}

function fmt(n: unknown) {
  return n != null ? `PKR ${Number(n).toLocaleString("en-PK")}` : "—"
}

export default async function AdminPlansPage() {
  const plans = await prisma.platformPlan.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { tenants: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Subscription Plans</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage the plans you offer to gyms — offline, self-hosted, and SaaS.
          </p>
        </div>
        <Link
          href="/admin/plans/new"
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-lg border border-border bg-white py-16 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">No plans yet.</p>
          <Link
            href="/admin/plans/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create first plan
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
                !plan.isActive ? "opacity-60" : "border-border"
              }`}
            >
              <div className="border-b border-border px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant={typeColors[plan.type]}>{typeLabels[plan.type]}</Badge>
                    <h2 className="mt-2 text-lg font-semibold text-foreground">{plan.name}</h2>
                    {plan.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{plan.description}</p>
                    )}
                  </div>
                  {!plan.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 space-y-3">
                {plan.oneTimePrice != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-primary">
                      {fmt(plan.oneTimePrice)}
                    </span>
                    <span className="text-xs text-muted-foreground">one-time</span>
                  </div>
                )}
                {plan.monthlyPrice != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-primary">
                      {fmt(plan.monthlyPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>
                )}

                {plan.features && (
                  <ul className="space-y-1 pt-1">
                    {plan.features.split("\n").filter(Boolean).slice(0, 5).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-0.5 text-success font-bold">✓</span>
                        {f.replace(/^[-•✓]\s*/, "")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border px-6 py-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {plan._count.tenants} gym{plan._count.tenants !== 1 ? "s" : ""} on this plan
                </div>
                <Link
                  href={`/admin/plans/${plan.id}/edit`}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
