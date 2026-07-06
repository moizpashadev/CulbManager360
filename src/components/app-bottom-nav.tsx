"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type SimpleNavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean }
export type SimpleNavGroup = { label: string; items: SimpleNavItem[] }

type Props = {
  groups: SimpleNavGroup[]
  primaryItems: SimpleNavItem[]
  menuTitle?: string
}

export function AppBottomNav({ groups, primaryItems, menuTitle = "Menu" }: Props) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      {/* Bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)] md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 active:bg-muted/40"
            >
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} strokeWidth={active ? 2.5 : 2} />
              <span className={cn("text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          )
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 active:bg-muted/40"
        >
          <Menu className={cn("h-5 w-5", moreOpen ? "text-primary" : "text-muted-foreground")} />
          <span className={cn("text-[10px] font-medium", moreOpen ? "text-primary" : "text-muted-foreground")}>
            More
          </span>
        </button>
      </nav>

      {/* "More" full menu — slide-up sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div
            className="relative flex max-h-[80vh] flex-col rounded-t-2xl bg-white shadow-2xl"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{menuTitle}</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-2 py-3">
              {groups.map((group) => (
                <div key={group.label} className="mb-3">
                  <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {group.label}
                  </p>
                  <ul>
                    {group.items.map(({ href, label, icon: Icon, exact }) => {
                      const active = isActive(href, exact)
                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={() => setMoreOpen(false)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                              active ? "bg-secondary font-medium text-primary" : "text-foreground active:bg-muted/50"
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
            </div>
          </div>
        </div>
      )}
    </>
  )
}
