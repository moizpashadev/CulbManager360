"use client"

import { useRouter } from "next/navigation"
import { LogOut, ChevronDown } from "lucide-react"

interface TopbarProps {
  userName: string
  tenantName: string
  role: string
}

export function Topbar({ userName, tenantName, role }: TopbarProps) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  return (
    <header
      className="flex h-14 items-center justify-between bg-topbar px-4 shrink-0 sm:px-6"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      {/* Brand */}
      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/mp360-icon-emerald.svg" alt="" className="h-7 w-7 shrink-0 rounded" />
        <span className="hidden truncate text-[15px] font-semibold tracking-tight text-topbar-foreground sm:inline">
          MP360
        </span>
        <span className="truncate rounded border border-primary/40 bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
          {role === "SUPER_ADMIN" ? "Super Admin" : tenantName}
        </span>
      </div>

      {/* Ctrl+K hint */}
      <button
        onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))}
        className="hidden items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-topbar-foreground/70 transition-colors hover:bg-white/20 hover:text-topbar-foreground sm:flex"
      >
        <span className="text-sm leading-none">⌘</span>K
        <span className="text-topbar-foreground/50">Search</span>
      </button>

      {/* Right: user info + logout */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-4">
        <div className="hidden items-center gap-1.5 text-sm text-topbar-foreground/80 sm:flex">
          <span className="font-medium text-topbar-foreground">{userName}</span>
          <ChevronDown className="h-3.5 w-3.5 text-topbar-foreground/50" />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2 py-1.5 text-xs text-topbar-foreground transition-colors hover:bg-white/20 sm:px-2.5"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
