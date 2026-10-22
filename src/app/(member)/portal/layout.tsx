import { getMemberSession } from "@/lib/member-auth/session"
import { MemberPortalTopbar } from "@/components/member-portal-topbar"

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getMemberSession()

  return (
    <div className="min-h-screen bg-background">
      <MemberPortalTopbar email={session?.email ?? ""} />
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  )
}
