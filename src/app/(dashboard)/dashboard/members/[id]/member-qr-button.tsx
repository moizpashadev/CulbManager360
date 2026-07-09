"use client"

import { useState } from "react"
import Link from "next/link"
import { QrCode, X, IdCard, MessageCircle } from "lucide-react"

type Props = { memberId: string; memberName: string; memberPhone: string | null }

export function MemberQrButton({ memberId, memberName, memberPhone }: Props) {
  const [open, setOpen] = useState(false)

  function handleWhatsApp() {
    const digits = memberPhone?.replace(/[^0-9]/g, "")
    const qrUrl = `${window.location.origin}/api/members/${memberId}/qr`
    const message = `Hi ${memberName}, here's your check-in QR code:\n${qrUrl}`
    const href = digits
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(href, "_blank")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        <QrCode className="h-3.5 w-3.5" />
        Show QR
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xs rounded-lg border border-border bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Check-in QR Code</h2>
              <button
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/members/${memberId}/qr`}
                alt={`Check-in QR code for ${memberName}`}
                className="h-56 w-56 rounded-md border border-border"
              />
              <p className="text-center text-sm font-medium text-foreground">{memberName}</p>
              <p className="text-center text-xs text-muted-foreground">
                Scan this at the front desk to check in — no internet needed on the member&apos;s side.
              </p>
              <button
                onClick={handleWhatsApp}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {memberPhone ? "Send via WhatsApp" : "Share via WhatsApp"}
              </button>
              <Link
                href={`/dashboard/members/${memberId}/card`}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                <IdCard className="h-3.5 w-3.5" />
                View / Share Membership Card
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
