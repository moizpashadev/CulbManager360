import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/db/prisma"
import { getSession } from "@/lib/auth/session"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Phone, Mail } from "lucide-react"
import { BranchEditForm } from "./branch-edit-form"

type Props = { params: { id: string } }

const employmentLabel: Record<string, string> = {
  SALARIED: "Salaried",
  COMMISSION: "Commission",
  SELF_EMPLOYED: "Self-Employed",
}

export default async function BranchDetailPage({ params }: Props) {
  const session = await getSession()
  if (!session) redirect("/login")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  const branch = await prisma.branch.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    include: {
      members: {
        orderBy: { firstName: "asc" },
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: { plan: { select: { name: true } } },
            take: 1,
          },
        },
      },
      staffBranches: {
        include: {
          staff: {
            select: {
              id: true, firstName: true, lastName: true,
              role: true, employmentType: true, specialization: true, isActive: true,
              trainerAssign: { where: { status: "ACTIVE" }, select: { id: true } },
            },
          },
        },
        where: { staff: { isActive: true } },
      },
      attendance: {
        where: { checkedInAt: { gte: today, lt: tomorrow } },
        include: { member: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { checkedInAt: "desc" },
      },
      invoices: {
        where: { paymentStatus: "PAID", createdAt: { gte: monthStart } },
        select: { total: true, type: true },
      },
    },
  })

  if (!branch) notFound()

  const revenueThisMonth = branch.invoices.reduce((s, inv) => s + Number(inv.total), 0)
  const trainers = branch.staffBranches.filter((sb) => sb.staff.role === "TRAINER")

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/branches">
          <button className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{branch.name}</h1>
            <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
              {branch.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{branch.address}</span>}
              {branch.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{branch.phone}</span>}
              {branch.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{branch.email}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={branch.isActive ? "success" : "secondary"}>{branch.isActive ? "Active" : "Inactive"}</Badge>
            <BranchEditForm
              branchId={branch.id}
              defaultValues={{
                name: branch.name,
                address: branch.address ?? "",
                phone: branch.phone ?? "",
                email: branch.email ?? "",
                isActive: branch.isActive,
              }}
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Members", value: branch.members.length },
          { label: "Trainers", value: trainers.length },
          { label: "Today's Check-ins", value: branch.attendance.length },
          { label: "Revenue This Month", value: `PKR ${revenueThisMonth.toLocaleString("en-PK")}`, mono: true },
        ].map(({ label, value, mono }) => (
          <div key={label} className="rounded-lg border border-border bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`mt-1 text-2xl font-bold text-foreground ${mono ? "font-mono text-xl text-primary" : ""}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Trainers at this branch */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Trainers</h2>
            <Link href="/dashboard/trainers/new" className="text-xs text-primary hover:underline">+ Add trainer</Link>
          </div>
          {trainers.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No trainers assigned to this branch.</p>
          ) : (
            <ul className="divide-y divide-border">
              {trainers.map(({ staff }) => (
                <li key={staff.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <Link href={`/dashboard/trainers/${staff.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                      {staff.firstName} {staff.lastName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {staff.specialization ?? "General Trainer"}
                      {staff.employmentType && ` · ${employmentLabel[staff.employmentType]}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-muted-foreground">{staff.trainerAssign.length} members</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Today check-ins */}
        <div className="rounded-lg border border-border bg-white shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Today&apos;s Check-ins</h2>
          </div>
          {branch.attendance.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No check-ins at this branch today.</p>
          ) : (
            <ul className="divide-y divide-border">
              {branch.attendance.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-6 py-3">
                  <Link href={`/dashboard/members/${a.member.id}`} className="text-sm font-medium text-foreground hover:text-primary">
                    {a.member.firstName} {a.member.lastName}
                  </Link>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(a.checkedInAt).toLocaleTimeString("en-PK", { timeStyle: "short" })}
                    {a.checkedOutAt && ` → ${new Date(a.checkedOutAt).toLocaleTimeString("en-PK", { timeStyle: "short" })}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Members at this branch */}
        <div className="rounded-lg border border-border bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium text-foreground">Members</h2>
            <span className="text-xs text-muted-foreground">{branch.members.length} total</span>
          </div>
          {branch.members.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No members registered at this branch.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Active Plan</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {branch.members.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/10">
                      <td className="px-6 py-3">
                        <Link href={`/dashboard/members/${m.id}`} className="font-medium text-foreground hover:text-primary">
                          {m.firstName} {m.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {m.memberships[0]?.plan.name ?? "—"}
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={m.status === "ACTIVE" ? "success" : m.status === "EXPIRED" ? "warning" : "secondary"}>
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
