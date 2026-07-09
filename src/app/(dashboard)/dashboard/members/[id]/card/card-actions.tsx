"use client"

import { useState } from "react"
import { Download, Share2, MessageCircle } from "lucide-react"

type Props = {
  memberName: string
  memberPhone: string | null
  imagePath: string
}

export function CardActions({ memberName, memberPhone, imagePath }: Props) {
  const [sharing, setSharing] = useState(false)

  const absoluteUrl = typeof window !== "undefined" ? `${window.location.origin}${imagePath}` : imagePath

  async function handleShare() {
    setSharing(true)
    try {
      const res = await fetch(imagePath)
      const blob = await res.blob()
      const file = new File([blob], "membership-card.png", { type: "image/png" })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Membership Card",
          text: `${memberName}'s membership card`,
        })
      } else {
        alert("Sharing files isn't supported on this browser/device. Use Download or WhatsApp instead.")
      }
    } catch {
      // user cancelled the share sheet — not an error
    } finally {
      setSharing(false)
    }
  }

  function handleWhatsApp() {
    const digits = memberPhone?.replace(/[^0-9]/g, "")
    const message = `Hi ${memberName}, here's your membership card for check-in:\n${absoluteUrl}`
    const href = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(href, "_blank")
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 print:hidden">
      <a
        href={imagePath}
        download="membership-card.png"
        className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
      >
        <Download className="h-4 w-4" />
        Download PNG
      </a>
      <button
        onClick={handleWhatsApp}
        className="flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        {memberPhone ? "Send via WhatsApp" : "Share via WhatsApp"}
      </button>
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors disabled:opacity-60"
      >
        <Share2 className="h-4 w-4" />
        {sharing ? "Sharing…" : "Share…"}
      </button>
    </div>
  )
}
