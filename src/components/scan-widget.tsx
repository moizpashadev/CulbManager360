"use client"

import { ScanLine, XCircle, LogIn, LogOut } from "lucide-react"
import { useScanLog } from "@/components/scan-provider"

export function ScanWidget({ compact = false }: { compact?: boolean }) {
  const log = useScanLog()
  const visibleLog = compact ? log.slice(0, 4) : log

  return (
    <div className={compact ? "grid grid-cols-1 gap-4 md:grid-cols-2" : "grid grid-cols-1 gap-5 lg:grid-cols-2"}>
      {/* Status */}
      <div className="rounded-lg border-2 border-dashed border-primary/30 bg-white shadow-sm">
        <div className={`flex flex-col items-center justify-center gap-3 text-center ${compact ? "px-4 py-8" : "px-6 py-16 gap-4"}`}>
          <div className={`flex items-center justify-center rounded-full bg-secondary ${compact ? "h-10 w-10" : "h-16 w-16"}`}>
            <ScanLine className={`text-primary animate-pulse ${compact ? "h-5 w-5" : "h-8 w-8"}`} />
          </div>
          <div>
            <p className={`font-semibold text-foreground ${compact ? "text-sm" : "text-lg"}`}>Scanning is active</p>
            <p className={`mt-1 text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>
              Works anywhere in the portal — no need to keep this page open. First scan checks in, next scan (after 5 min) checks out.
            </p>
          </div>
        </div>
      </div>

      {/* Live log */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium text-foreground">Scan Log</h2>
          {!compact && <p className="text-xs text-muted-foreground">This session only — refresh clears it.</p>}
        </div>
        {visibleLog.length === 0 ? (
          <p className={`text-center text-sm text-muted-foreground ${compact ? "px-6 py-6" : "px-6 py-10"}`}>No scans yet.</p>
        ) : (
          <ul className={`divide-y divide-border overflow-y-auto ${compact ? "max-h-[200px]" : "max-h-[420px]"}`}>
            {visibleLog.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-6 py-3">
                {entry.ok ? (
                  entry.action === "check-out" ? (
                    <LogOut className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  )
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{entry.message}</p>
                  {entry.warning && (
                    <p className="mt-0.5 text-xs text-warning">⚠ {entry.warning}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{entry.time}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
