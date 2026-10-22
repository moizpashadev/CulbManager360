"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Non-fatal — the portal works fine without a service worker, it
      // just loses offline fallback and push notification support.
    })
  }, [])

  return null
}
