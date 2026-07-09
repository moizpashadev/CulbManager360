"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { CheckCircle2, XCircle, LogOut, X } from "lucide-react"

export type ScanEntry = {
  id: number
  ok: boolean
  action?: "check-in" | "check-out"
  message: string
  warning?: string | null
  time: string
}

type ScanContextValue = {
  log: ScanEntry[]
}

const ScanContext = createContext<ScanContextValue>({ log: [] })

export function useScanLog() {
  return useContext(ScanContext).log
}

// USB/Bluetooth barcode & QR scanners behave as keyboards: they "type" the
// decoded payload very fast (each keystroke a few ms apart) and finish with
// Enter. A human never types that fast, so we tell scans apart from normal
// typing purely by inter-keystroke timing — no focused input required, and
// nothing on the page is interrupted unless the burst actually matches our
// QR payload prefix.
const FAST_KEYSTROKE_MS = 60
const SCAN_PREFIX = "CM360:"
const MAX_TOASTS = 4
const TOAST_LIFETIME_MS = 6000

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [log, setLog] = useState<ScanEntry[]>([])
  const [toasts, setToasts] = useState<ScanEntry[]>([])
  const bufferRef = useRef("")
  const lastKeyTimeRef = useRef(0)
  const busyRef = useRef(false)
  const idRef = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const pushEntry = useCallback((entry: Omit<ScanEntry, "id">) => {
    const withId = { ...entry, id: ++idRef.current }
    setLog((prev) => [withId, ...prev].slice(0, 50))
    setToasts((prev) => [withId, ...prev].slice(0, MAX_TOASTS))
    setTimeout(() => dismissToast(withId.id), TOAST_LIFETIME_MS)
  }, [dismissToast])

  const handleScan = useCallback(async (raw: string) => {
    const value = raw.trim()
    if (!value || busyRef.current) return
    busyRef.current = true

    const memberId = value.slice(SCAN_PREFIX.length)
    const time = new Date().toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" })

    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      })
      const data = await res.json()

      if (res.ok) {
        const name = `${data.member.firstName} ${data.member.lastName}`
        pushEntry({
          ok: true,
          action: data.action,
          message: data.action === "check-out" ? `${name} checked out` : `${name} checked in`,
          warning: data.warning,
          time,
        })
      } else {
        pushEntry({ ok: false, message: data.error ?? "Scan failed", time })
      }
    } catch {
      pushEntry({ ok: false, message: "Network error — check connection", time })
    } finally {
      busyRef.current = false
    }
  }, [pushEntry])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const now = Date.now()
      const gap = now - lastKeyTimeRef.current
      lastKeyTimeRef.current = now

      if (e.key === "Enter") {
        const buffered = bufferRef.current
        bufferRef.current = ""
        if (gap <= FAST_KEYSTROKE_MS && buffered.startsWith(SCAN_PREFIX)) {
          e.preventDefault()
          handleScan(buffered)
        }
        return
      }

      if (e.key.length === 1) {
        // Printable character — part of a possible scan burst.
        bufferRef.current = gap <= FAST_KEYSTROKE_MS ? bufferRef.current + e.key : e.key
        if (bufferRef.current.length > 128) bufferRef.current = bufferRef.current.slice(-128)
      } else if (e.key !== "Shift") {
        // Any other control key (Tab, Escape, arrows…) breaks the burst.
        bufferRef.current = ""
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [handleScan])

  return (
    <ScanContext.Provider value={{ log }}>
      {children}

      {/* Toasts — visible from anywhere in the portal */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-80 items-start gap-3 rounded-lg border border-border bg-white p-3 shadow-lg"
          >
            {t.ok ? (
              t.action === "check-out" ? (
                <LogOut className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              )
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{t.message}</p>
              {t.warning && <p className="mt-0.5 text-xs text-warning">⚠ {t.warning}</p>}
            </div>
            <button onClick={() => dismissToast(t.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ScanContext.Provider>
  )
}
