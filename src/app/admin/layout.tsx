import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Topbar } from "@/components/topbar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") redirect("/login")

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Topbar
        userName={`${session.firstName} ${session.lastName}`}
        tenantName="Platform Admin"
        role={session.role}
      />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  )
}
