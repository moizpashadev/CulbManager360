"use client"

import { Dumbbell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MemberPortalTopbar({ email }: { email: string }) {
  async function handleLogout() {
    await fetch("/api/member/auth/logout", { method: "POST" })
    window.location.href = "/member-login"
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Dumbbell className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold">Club Manager 360</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{email}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="mr-1.5 h-4 w-4" />
          Log out
        </Button>
      </div>
    </header>
  )
}
