import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, HeartPulse } from "lucide-react"
import { MemberEditForm } from "./member-edit-form"
import { AssignPlanForm } from "./assign-plan-form"
import { CancelMembershipButton } from "./cancel-membership-button"
import { MembershipPauseButton } from "./membership-pause-button"
import { GenerateInvoiceButton } from "./generate-invoice-button"

type Props = { params: { id: string }; searchParams: { assign?: string } }

const statusColors: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  ACTIVE: "success", INACTIVE: "secondary", SUSPENDED: "destructive", EXPIRED: "warning", PAUSED: "warning",
}
const paymentColors: Record<string, "success" | "warning" | "secondary"> = {
  PAID: "success", PENDING: "warning", PARTIAL: "warning", WAIVED: "secondary",
}

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

export default async function MemberProfilePage({ params, searchParams }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const isNewMember = searchParams.assign === "true"

  const [member, plans, branches] = await Promise.all([
    prisma.member.findFirst({
      where: { id: params.id, tenantId: session.tenantId },
      include: {
        memberships: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
        },
        attendance: {
          orderBy: { checkedInAt: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    }),
    prisma.membershipPlan.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.branch.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ])

  if (!member) notFound()

  const activeMembership = member.memberships.find((m) => m.status === "ACTIVE" || m.status === "PAUSED")

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/members">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {member.firstName} {member.lastName}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">{member.email}</p>
          </div>
          <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/members/${member.id}/health`}
                className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <HeartPulse className="h-3.5 w-3.5" />
                Health & Progress
              </Link>
              <Badge variant={statusColors[member.status] ?? "secondary"}>{member.status}</Badge>
            </div>
        </div>
      </div>

      {/* New member banner */}
      {isNewMember && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-sm font-bold">
            ✓
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Member registered!</p>
            <p className="text-xs text-green-700">Now pick which facilities they want — membership will be assigned right away.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left col */}
        <div className="space-y-5 lg:col-span-2">
          {/* Membership first when coming from new member flow — only if not already assigned */}
          {isNewMember && !activeMembership && (
            <div className="rounded-lg border-2 border-primary/30 bg-white shadow-sm">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-sm font-semibold text-foreground">Assign Membership</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Select facilities or choose a pre-built plan</p>
              </div>
              <div className="p-6">
                <AssignPlanForm
                  memberId={member.id}
                  plans={plans}
                  defaultTab="facility"
                  redirectAfter={`/dashboard/members/${member.id}`}
                />
              </div>
            </div>
          )}

          {/* Edit form */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Member Details</h2>
            </div>
            <MemberEditForm member={member} branches={branches} />
          </div>

          {/* Membership */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Active Membership</h2>
              {activeMembership && (
                <div className="flex items-center gap-2">
                  <MembershipPauseButton membershipId={activeMembership.id} status={activeMembership.status} />
                  <CancelMembershipButton memberId={member.id} membershipId={activeMembership.id} />
                </div>
              )}
            </div>

            {activeMembership ? (
              <div className="p-6 space-y-3">
                <div className="flex items-start justify-between rounded-md bg-secondary/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{activeMembership.plan.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activeMembership.startDate).toLocaleDateString("en-PK")}
                      {" → "}
                      {new Date(activeMembership.endDate).toLocaleDateString("en-PK")}
                      {" · "}
                      {activeMembership.plan.durationDays} days
                    </p>
                    {activeMembership.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{activeMembership.notes}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {fmt(activeMembership.finalPrice)}
                    </p>
                    {Number(activeMembership.discount) > 0 && (
                      <p className="text-xs text-muted-foreground line-through">
                        {fmt(activeMembership.plan.price)}
                      </p>
                    )}
                  </div>
                </div>

                <details className="group">
                  <summary className="cursor-pointer text-xs text-primary hover:underline">
                    Renew / assign different plan
                  </summary>
                  <div className="mt-4">
                    <AssignPlanForm memberId={member.id} plans={plans} />
                  </div>
                </details>
              </div>
            ) : (
              <div className="p-6">
                {plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No active plans.{" "}
                    <Link href="/dashboard/plans/new" className="text-primary hover:underline">
                      Create one first.
                    </Link>
                  </p>
                ) : (
                  <AssignPlanForm memberId={member.id} plans={plans} />
                )}
              </div>
            )}
          </div>

          {/* Invoice history */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Billing History</h2>
              <div className="flex items-center gap-3">
                <GenerateInvoiceButton memberId={member.id} />
                <Link href={`/dashboard/billing?memberId=${member.id}`} className="text-xs text-primary hover:underline">
                  All invoices
                </Link>
              </div>
            </div>
            {member.invoices.length === 0 ? (
              <p className="px-6 py-6 text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {member.invoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/dashboard/billing/${inv.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {inv.type.toLowerCase().replace("_", " ")}
                        {inv.description && ` — ${inv.description}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString("en-PK")}
                        {inv.paymentMethod && ` · ${inv.paymentMethod.replace(/_/g, " ")}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-mono text-sm font-semibold text-foreground">{fmt(inv.total)}</p>
                      <Badge variant={paymentColors[inv.paymentStatus] ?? "secondary"}>
                        {inv.paymentStatus}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {/* Info */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Info</h2>
            </div>
            <dl className="divide-y divide-border">
              {[
                { label: "Joined", value: new Date(member.joinDate).toLocaleDateString("en-PK") },
                { label: "Consumer #", value: member.consumerNumber ?? "—" },
                { label: "Phone", value: member.phone ?? "—" },
                { label: "CNIC", value: member.cnic ?? "—" },
                {
                  label: "Date of Birth",
                  value: member.dateOfBirth
                    ? new Date(member.dateOfBirth).toLocaleDateString("en-PK")
                    : "—",
                },
                {
                  label: "Emergency Contact",
                  value: member.emergencyContact
                    ? `${member.emergencyContact}${member.emergencyPhone ? ` · ${member.emergencyPhone}` : ""}`
                    : "—",
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-4 px-6 py-3">
                  <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
                  <dd className="text-right text-sm font-medium text-foreground">{value}</dd>
                </div>
              ))}
              {member.medicalNotes && (
                <div className="px-6 py-3">
                  <dt className="text-xs text-muted-foreground">Medical Notes</dt>
                  <dd className="mt-1 text-sm text-foreground">{member.medicalNotes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Recent check-ins */}
          <div className="rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-medium text-foreground">Recent Check-ins</h2>
            </div>
            {member.attendance.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">No check-ins yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {member.attendance.map((a) => (
                  <li key={a.id} className="px-6 py-3">
                    <p className="text-sm text-foreground">
                      {new Date(a.checkedInAt).toLocaleString("en-PK", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.method.replace("_", " ").toLowerCase()}
                      {a.checkedOutAt && (
                        <> · out {new Date(a.checkedOutAt).toLocaleTimeString("en-PK", { timeStyle: "short" })}</>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
