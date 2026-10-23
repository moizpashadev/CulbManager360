"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, X, Share } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIosSafari, setIsIosSafari] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Already installed (running standalone) — never show the prompt.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true
    if (standalone) return

    function onPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)

    // iOS Safari never fires beforeinstallprompt — there is no API for it.
    // Detect it and show manual "Add to Home Screen" instructions instead.
    // Excludes Chrome/Firefox-on-iOS (CriOS/FxiOS), which don't expose
    // Add to Home Screen the same way Safari does.
    const ua = window.navigator.userAgent
    const isIos = /iPad|iPhone|iPod/.test(ua)
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
    setIsIosSafari(isIos && isSafari)

    return () => window.removeEventListener("beforeinstallprompt", onPrompt)
  }, [])

  if (dismissed) return null
  if (!deferredPrompt && !isIosSafari) return null

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  if (isIosSafari && !deferredPrompt) {
    return (
      <div className="flex items-center justify-between gap-3 border-b bg-primary/5 px-4 py-2 text-sm">
        <span className="flex items-center gap-1.5 text-foreground">
          Tap <Share className="inline h-4 w-4" /> then &ldquo;Add to Home Screen&rdquo; to install
        </span>
        <button onClick={() => setDismissed(true)} className="shrink-0 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b bg-primary/5 px-4 py-2 text-sm">
      <span className="text-foreground">Install Me360 for quick access</span>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={install}>
          <Download className="mr-1.5 h-4 w-4" />
          Install
        </Button>
        <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
