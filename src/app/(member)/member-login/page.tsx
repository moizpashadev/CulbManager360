"use client"

import { useState, useRef, useEffect } from "react"
import { Dumbbell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

type Step = "email" | "code"

export default function MemberLoginPage() {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const [ref, setRef] = useState<string | null>(null)

  // Read ?ref= without useSearchParams() so this page stays statically
  // prerenderable (useSearchParams forces a Suspense boundary otherwise).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRef(params.get("ref"))
  }, [])

  function startCooldown(seconds: number) {
    setCooldown(seconds)
    if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    cooldownTimer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current)
          return 0
        }
        return s - 1
      })
    }, 1000)
  }

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/member/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setStep("code")
      startCooldown(60)
    } else {
      setError(data.error ?? "Something went wrong")
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/member/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, ref }),
    })
    const data = await res.json()
    if (res.ok) {
      window.location.href = data.redirect ?? "/portal"
    } else {
      setError(data.error ?? "Invalid or expired code")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Member Login</CardTitle>
          <CardDescription>
            {step === "email"
              ? "Enter your email to get a login code"
              : `We sent a 6-digit code to ${email}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {step === "email" ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send login code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">6-digit code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoComplete="one-time-code"
                  placeholder="000000"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-[0.4em]"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
                {loading ? "Verifying…" : "Verify & continue"}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => { setStep("email"); setCode(""); setError("") }}
                >
                  Change email
                </button>
                <button
                  type="button"
                  className="font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
                  disabled={cooldown > 0 || loading}
                  onClick={() => sendOtp()}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
