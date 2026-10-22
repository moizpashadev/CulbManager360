import webpush from "web-push"
import { prisma } from "@/lib/db/prisma"

let configured = false
function ensureConfigured() {
  if (configured) return
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return
  webpush.setVapidDetails("mailto:noreply@meyvnlabs.com", publicKey, privateKey)
  configured = true
}

// Sends to every device the member has notifications enabled on. Silently
// drops subscriptions the push service reports as gone (410/404) — that's
// the normal lifecycle of a push subscription (uninstalled app, cleared
// browser data, etc.), not an error worth surfacing.
export async function sendPushToAccount(accountId: string, payload: { title: string; body: string; url?: string }) {
  ensureConfigured()
  if (!configured) return

  const subs = await prisma.memberPushSubscription.findMany({ where: { accountId } })
  if (subs.length === 0) return

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await prisma.memberPushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
        }
      }
    })
  )
}
