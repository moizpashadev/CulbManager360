"use client"

import { Printer, MessageCircle, Mail } from "lucide-react"

type Props = {
  memberName: string
  memberPhone: string | null
  memberEmail: string | null
  amount: string
  invoiceId: string
  gymName: string
}

export function ReceiptActions({ memberName, memberPhone, memberEmail, amount, invoiceId, gymName }: Props) {
  function handlePrint() {
    window.print()
  }

  const whatsappMsg = encodeURIComponent(
    `Dear ${memberName},\n\nYour payment of ${amount} has been received at ${gymName}.\nInvoice #: ${invoiceId.slice(-8).toUpperCase()}\n\nThank you!`
  )
  const whatsappHref = memberPhone
    ? `https://wa.me/${memberPhone.replace(/[^0-9]/g, "")}?text=${whatsappMsg}`
    : null

  const mailtoHref = memberEmail
    ? `mailto:${memberEmail}?subject=Payment Receipt - ${gymName}&body=${encodeURIComponent(
        `Dear ${memberName},\n\nYour payment of ${amount} has been received at ${gymName}.\nInvoice #: ${invoiceId.slice(-8).toUpperCase()}\n\nThank you for choosing us!\n\n${gymName}`
      )}`
    : null

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        onClick={handlePrint}
        className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      )}
      {mailtoHref && (
        <a
          href={mailtoHref}
          className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <Mail className="h-4 w-4" />
          Email
        </a>
      )}
    </div>
  )
}
