"use client"

import { MessageCircle } from "lucide-react"

type Props = {
  memberName: string
  memberPhone: string
  paymentLink: string
  gymName: string
}

export function SendPaymentLinkButton({ memberName, memberPhone, paymentLink, gymName }: Props) {
  const message = encodeURIComponent(
    `Dear ${memberName},\n\nYou can pay your bill at ${gymName} directly here:\n${paymentLink}\n\nThank you!`
  )
  const href = `https://wa.me/${memberPhone.replace(/[^0-9]/g, "")}?text=${message}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
    >
      <MessageCircle className="h-4 w-4" />
      Send Payment Link
    </a>
  )
}
