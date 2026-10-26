import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { ComposeForm } from "./compose-form"

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "All members",
  EXPIRING_SOON: "Expiring in 7 days",
  OUTSTANDING_PAYMENT: "Outstanding payment",
  BRANCH: "Branch",
}

export default async function AnnouncementsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const canSend = ["OWNER", "ADMIN", "MANAGER"].includes(session.role)

  const [branches, history] = await Promise.all([
    prisma.branch.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.announcement.findMany({
      where: { tenantId: session.tenantId },
      include: {
        createdByStaff: { select: { firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ])

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Announcements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Send a push notification to your members&apos; Me360 app. Only members who have the app installed and
          notifications enabled will receive it.
        </p>
      </div>

      {canSend ? (
        <ComposeForm branches={branches} />
      ) : (
        <div className="mb-8 rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground shadow-sm">
          Only owners, admins, and managers can send announcements.
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Sent History</h2>
        {history.length === 0 ? (
          <div className="rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground shadow-sm">
            No announcements sent yet.
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
            {history.map((a) => (
              <div key={a.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("en-PK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {AUDIENCE_LABEL[a.audience]}
                  {a.branch && ` — ${a.branch.name}`}
                  {" · "}
                  Delivered to {a.sentCount} of {a.recipientCount} targeted members
                  {" · "}
                  Sent by {a.createdByStaff.firstName} {a.createdByStaff.lastName}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
