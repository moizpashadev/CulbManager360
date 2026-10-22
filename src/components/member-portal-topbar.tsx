"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationToggle } from "@/components/notification-toggle"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/portal", label: "Home", exact: true },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/classes", label: "Classes" },
  { href: "/portal/courts", label: "Courts" },
  { href: "/portal/progress", label: "Progress" },
  { href: "/portal/checkin", label: "Check-in" },
  { href: "/portal/find-gym", label: "Find Gym" },
  { href: "/portal/referral", label: "Invite" },
]

export function MemberPortalTopbar({ email }: { email: string }) {
  const pathname = usePathname()

  async function handleLogout() {
    await fetch("/api/member/auth/logout", { method: "POST" })
    window.location.href = "/member-login"
  }

  return (
    <header className="border-b bg-card">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Dumbbell className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold">Club Manager 360</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationToggle />
          <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
