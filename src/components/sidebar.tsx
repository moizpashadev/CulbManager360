"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getVisibleGroups } from "@/lib/dashboard-nav"

type Props = {
  role: string
  moduleGym: boolean
  moduleCourts: boolean
}

export function Sidebar({ role, moduleGym, moduleCourts }: Props) {
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  const rendered = getVisibleGroups(role, moduleGym, moduleCourts)

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-white md:flex">
      <nav className="flex-1 overflow-y-auto py-4">
        {rendered.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.label}
            </p>
            <ul>
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        "flex items-center gap-3 border-l-2 px-4 py-2 text-sm transition-colors",
                        active
                          ? "border-primary bg-secondary text-primary font-medium"
                          : "border-transparent text-muted-foreground hover:border-border hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground">Club Manager 360 v1.0 · 2026</p>
      </div>
    </aside>
  )
}
