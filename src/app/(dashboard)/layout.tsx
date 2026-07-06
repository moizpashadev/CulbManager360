import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { Sidebar } from "@/components/sidebar"
import { Topbar } from "@/components/topbar"
import { CommandPalette } from "@/components/command-palette"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")
  if (session.tenantId === "__super__") redirect("/admin")

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Topbar
        userName={`${session.firstName} ${session.lastName}`}
        tenantName={session.tenantName ?? "Gym"}
        role={session.role}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={session.role} moduleGym={session.moduleGym} moduleCourts={session.moduleCourts} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-20 sm:p-8 md:pb-8">{children}</main>
      </div>
      <MobileBottomNav role={session.role} moduleGym={session.moduleGym} moduleCourts={session.moduleCourts} />
      <CommandPalette />
    </div>
  )
}
