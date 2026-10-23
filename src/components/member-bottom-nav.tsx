"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, QrCode, CalendarCheck, Receipt, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/portal", label: "Home", icon: Home, exact: true },
  { href: "/portal/checkin", label: "Check-in", icon: QrCode },
  { href: "/portal/book", label: "Book", icon: CalendarCheck },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal/more", label: "More", icon: MoreHorizontal },
]

export function MemberBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur sm:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-between px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
