import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { RequestActions } from "./request-actions"

export default async function JoinRequestsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const requests = await prisma.memberJoinRequest.findMany({
    where: { tenantId: session.tenantId, status: "PENDING" },
    include: { account: { select: { email: true } } },
    orderBy: { createdAt: "asc" },
  })

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Join Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People who found your gym in the member app and asked to be added.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-6 text-sm text-muted-foreground shadow-sm">
          No pending requests.
        </div>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {r.firstName} {r.lastName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.account.email}
                  {r.phone && ` · ${r.phone}`}
                  {" · "}
                  {new Date(r.createdAt).toLocaleDateString("en-PK")}
                </p>
                {r.message && <p className="mt-1 text-xs text-muted-foreground">&ldquo;{r.message}&rdquo;</p>}
              </div>
              <RequestActions id={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
