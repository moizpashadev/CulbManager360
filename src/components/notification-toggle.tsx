"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificationToggle() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window
    setSupported(ok)
    if (!ok) return
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    })
  }, [])

  async function enable() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setLoading(false)
        return
      }
      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error("Push not configured")
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })
      await fetch("/api/member/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      setSubscribed(true)
    } catch {
      // permission denied, unsupported, or network error — leave as not subscribed
    }
    setLoading(false)
  }

  async function disable() {
    setLoading(true)
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch("/api/member/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setSubscribed(false)
    setLoading(false)
  }

  if (!supported) return null

  return (
    <Button variant="outline" size="sm" disabled={loading} onClick={subscribed ? disable : enable}>
      {subscribed ? <BellOff className="mr-1.5 h-4 w-4" /> : <Bell className="mr-1.5 h-4 w-4" />}
      {subscribed ? "Notifications on" : "Enable notifications"}
    </Button>
  )
}
