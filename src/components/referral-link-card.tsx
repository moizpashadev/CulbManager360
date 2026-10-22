"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

export function ReferralLinkCard({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API unavailable — select the text instead
    }
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-2 py-5">
        <Input readOnly value={link} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
        <Button onClick={copy} variant="outline" size="sm" className="shrink-0">
          {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </CardContent>
    </Card>
  )
}
