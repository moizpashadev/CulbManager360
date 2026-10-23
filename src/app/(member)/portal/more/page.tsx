"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { MemberPageHeader } from "@/components/member-page-header"
import { TrendingUp, Search, Users, LogOut, ChevronRight, MoreHorizontal } from "lucide-react"

const LINKS = [
  { href: "/portal/progress", label: "Progress", desc: "Log measurements, see your trend", icon: TrendingUp },
  { href: "/portal/find-gym", label: "Find a Gym", desc: "Search and request to join", icon: Search },
  { href: "/portal/referral", label: "Invite Friends", desc: "Share your referral link", icon: Users },
]

export default function PortalMorePage() {
  async function handleLogout() {
    await fetch("/api/member/auth/logout", { method: "POST" })
    window.location.href = "/member-login"
  }

  return (
    <div className="space-y-6">
      <MemberPageHeader icon={MoreHorizontal} title="More" />

      <div className="space-y-3">
        {LINKS.map(({ href, label, desc, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="transition-colors hover:border-primary/40 hover:bg-primary/5">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}

        <button onClick={handleLogout} className="w-full text-left">
          <Card className="transition-colors hover:border-red-200 hover:bg-red-50">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <LogOut className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-600">Log out</p>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      <p className="pt-4 text-center text-xs text-muted-foreground">Me360 · Powered by Club Manager 360</p>
    </div>
  )
}
