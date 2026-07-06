"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Dumbbell, Users, CreditCard, CheckSquare, BarChart2, Building2, Zap, Eye, EyeOff } from "lucide-react"

/* ── mock data ── */
const MEMBERS = [
  { name: "Ahmed Khan",    init: "AK", plan: "Monthly",   status: "ACTIVE"  },
  { name: "Sara Malik",    init: "SM", plan: "Quarterly", status: "ACTIVE"  },
  { name: "Usman Raza",    init: "UR", plan: "Monthly",   status: "EXPIRED" },
  { name: "Fatima Sheikh", init: "FS", plan: "Yearly",    status: "ACTIVE"  },
]
const INVOICES = [
  { name: "Ahmed Khan", amount: "3,500", paid: true  },
  { name: "Sara Malik", amount: "9,000", paid: false },
  { name: "Bilal Ahmed",amount: "3,500", paid: true  },
]
const FEATURES = [
  { icon: Users,       label: "Member Management",   desc: "Profiles, plans & renewals"    },
  { icon: CreditCard,  label: "Billing & Invoices",  desc: "Auto-invoicing & Kuickpay BPS" },
  { icon: CheckSquare, label: "Attendance Tracking", desc: "QR check-in & daily log"       },
  { icon: BarChart2,   label: "Revenue Reports",     desc: "Monthly trends at a glance"    },
  { icon: Building2,   label: "Multi-Branch",        desc: "All locations, one login"      },
  { icon: Zap,         label: "Role-Based Access",   desc: "Staff, trainers & managers"    },
]

/* ── light dashboard content ── */
function DashboardContent({ phase }: { phase: number }) {
  const revenue = phase >= 2 ? "51,700" : "48,200"
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", color: "#0f172a", fontSize: 9.5, background: "#f8fafc", userSelect: "none" }}>

      {/* topbar */}
      <div style={{ background: "#0a8f5c", padding: "5px 10px", display: "flex", alignItems: "center", gap: 6 }}>
        <Dumbbell size={9} color="white" />
        <span style={{ color: "white", fontWeight: 700, fontSize: 9 }}>Club Manager 360</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {["Members","Billing","Attendance","Reports"].map(t => (
            <span key={t} style={{ color: "rgba(255,255,255,0.65)", fontSize: 7.5, padding: "1.5px 5px", borderRadius: 3 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5, padding: "8px 8px 6px", borderBottom: "1px solid #e2e8f0" }}>
        {[
          { label: "Total Members", value: "247"            },
          { label: "Revenue / Mo",  value: `PKR ${revenue}` },
          { label: "Active Today",  value: "38"             },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: "white", borderRadius: 5, padding: "5px 7px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 6.5, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
            <motion.div key={value} initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }}
              style={{ fontWeight: 700, fontSize: 10, color: "#0f172a" }}
            >{value}</motion.div>
          </div>
        ))}
      </div>

      {/* body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* members */}
        <div style={{ padding: "7px 8px", borderRight: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748b", marginBottom: 5 }}>Members</div>
          {MEMBERS.map((m, i) => (
            <motion.div key={m.name}
              initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3.5px 0", borderBottom: i < MEMBERS.length - 1 ? "1px solid #f1f5f9" : "none" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: m.status === "ACTIVE" ? "#dcfce7" : "#fef3c7",
                  color: m.status === "ACTIVE" ? "#16a34a" : "#d97706",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6, fontWeight: 700,
                }}>{m.init}</div>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 7, color: "#94a3b8" }}>{m.plan}</div>
                </div>
              </div>
              <div style={{ fontSize: 6.5, fontWeight: 600, padding: "1.5px 5px", borderRadius: 999,
                background: m.status === "ACTIVE" ? "#f0fdf4" : "#fffbeb",
                color: m.status === "ACTIVE" ? "#16a34a" : "#d97706",
              }}>{m.status}</div>
            </motion.div>
          ))}
        </div>

        {/* invoices */}
        <div style={{ padding: "7px 8px" }}>
          <div style={{ fontSize: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748b", marginBottom: 5 }}>Invoices</div>
          {INVOICES.map((inv, i) => {
            const paid = inv.paid || (phase >= 2 && i === 1)
            return (
              <motion.div key={i}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.15 + i * 0.09 }}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3.5px 0", borderBottom: i < INVOICES.length - 1 ? "1px solid #f1f5f9" : "none" }}
              >
                <div>
                  <div style={{ fontSize: 8, fontWeight: 500 }}>{inv.name}</div>
                  <div style={{ fontSize: 7, color: "#94a3b8", fontFamily: "monospace" }}>PKR {inv.amount}</div>
                </div>
                <motion.div animate={{ background: paid ? "#f0fdf4" : "#fffbeb", color: paid ? "#16a34a" : "#d97706" }}
                  transition={{ duration: 0.5 }}
                  style={{ fontSize: 6.5, fontWeight: 700, padding: "1.5px 5px", borderRadius: 999 }}
                >{paid ? "PAID" : "PENDING"}</motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* attendance strip */}
      <div style={{ background: "#f1f5f9", borderTop: "1px solid #e2e8f0", padding: "5px 8px", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 7, color: "#64748b", fontWeight: 600 }}>Live Attendance</span>
        <div style={{ display: "flex", gap: 3 }}>
          {["AK","SM","FS","BA"].map(init => (
            <div key={init} style={{ width: 16, height: 16, borderRadius: "50%", background: "#dcfce7", color: "#0a8f5c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 5.5, fontWeight: 700, border: "1px solid #bbf7d0" }}>{init}</div>
          ))}
          <span style={{ fontSize: 7, color: "#94a3b8", alignSelf: "center" }}>+34 today</span>
        </div>
      </div>
    </div>
  )
}

/* ── browser window frame ── */
function BrowserMockup({ phase }: { phase: number }) {
  const [hoverTilt, setHoverTilt] = useState<{ x: number; y: number } | null>(null)

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setHoverTilt({ x: px, y: py })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
      style={{ perspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverTilt(null)}
    >
      <motion.div
        animate={
          hoverTilt
            ? { rotateX: hoverTilt.y * -18, rotateY: hoverTilt.x * 18, y: -8, scale: 1.02 }
            : { rotateX: [2, 1, 2], rotateY: [-3, -2, -3], y: [0, -5, 0], scale: 1 }
        }
        transition={
          hoverTilt
            ? { type: "spring", stiffness: 220, damping: 20 }
            : { duration: 9, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ transformStyle: "preserve-3d", position: "relative" }}
      >
        {/* shadow glow */}
        <div style={{
          position: "absolute", inset: -1, borderRadius: 13, pointerEvents: "none",
          boxShadow: "0 0 40px rgba(10,143,92,0.12), 0 40px 80px rgba(0,0,0,0.5)",
        }} />

        {/* frame */}
        <div style={{
          borderRadius: 12, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}>
          {/* browser chrome */}
          <div style={{
            background: "#1e2a3a",
            padding: "7px 12px",
            display: "flex", alignItems: "center", gap: 10,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}>
            {/* traffic lights */}
            <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
              {["#ff5f57", "#ffbd2e", "#28c840"].map(c => (
                <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: c, opacity: 0.9 }} />
              ))}
            </div>
            {/* URL bar */}
            <div style={{
              flex: 1,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 5, padding: "3px 10px",
              fontSize: 7.5, color: "rgba(255,255,255,0.4)",
              textAlign: "center", fontFamily: "monospace", letterSpacing: "0.02em",
            }}>
              app.clubmanager360.com/dashboard
            </div>
            <div style={{ width: 36 }} />
          </div>

          {/* light dashboard */}
          <DashboardContent phase={phase} />
        </div>

        {/* toast — check-in */}
        <AnimatePresence>
          {phase === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 14, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,  scale: 1   }}
              exit={{    opacity: 0, x: 10, scale: 0.95 }}
              style={{
                position: "absolute", bottom: -10, right: -20,
                background: "white",
                border: "1px solid #e2e8f0", borderLeft: "3px solid #0a8f5c",
                borderRadius: 9, padding: "7px 11px",
                boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
                display: "flex", alignItems: "center", gap: 8, minWidth: 162,
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#f0fdf4", color: "#0a8f5c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>✓</div>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#0f172a", fontFamily: "system-ui" }}>Check-in</div>
                <div style={{ fontSize: 8.5, color: "#64748b", fontFamily: "system-ui" }}>Zara Hussain — just now</div>
              </div>
            </motion.div>
          )}
          {phase === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 14, scale: 0.9 }}
              animate={{ opacity: 1, x: 0,  scale: 1   }}
              exit={{    opacity: 0, x: 10, scale: 0.95 }}
              style={{
                position: "absolute", bottom: -10, right: -20,
                background: "white",
                border: "1px solid #bbf7d0", borderLeft: "3px solid #16a34a",
                borderRadius: 9, padding: "7px 11px",
                boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
                display: "flex", alignItems: "center", gap: 8, minWidth: 172,
              }}
            >
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>₨</div>
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 700, color: "#0f172a", fontFamily: "system-ui" }}>Payment Received</div>
                <div style={{ fontSize: 8.5, color: "#16a34a", fontWeight: 600, fontFamily: "system-ui" }}>Sara Malik — PKR 9,000</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  LOGIN PAGE                                               */
/* ══════════════════════════════════════════════════════════ */

export default function LoginPage() {
  const router  = useRouter()
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [phase,    setPhase]    = useState(0)
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)

  useEffect(() => {
    function cycle() {
      setPhase(0)
      const t1 = setTimeout(() => setPhase(1), 2400)
      const t2 = setTimeout(() => setPhase(2), 5000)
      return [t1, t2]
    }
    let timers = cycle()
    const iv = setInterval(() => { timers.forEach(clearTimeout); timers = cycle() }, 9000)
    return () => { timers.forEach(clearTimeout); clearInterval(iv) }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd  = new FormData(e.currentTarget)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password") }),
    })
    const data = await res.json()
    if (res.ok) {
      window.location.href = data.redirect ?? "/dashboard"
    } else {
      setError(data.error ?? "Login failed")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* ══════ LEFT ══════ */}
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-[55%] flex-col py-10 px-10"
        style={{ background: "linear-gradient(145deg, #0d1117 0%, #0e1a14 50%, #0c1520 100%)" }}
      >
        {/* ambient orbs */}
        {[
          { w: 400, h: 400, top: "-15%", left: "-8%",  delay: 0,   dur: 14 },
          { w: 240, h: 240, top: "60%",  left: "60%",  delay: 3,   dur: 17 },
          { w: 160, h: 160, top: "20%",  left: "72%",  delay: 1.5, dur: 11 },
        ].map((o, i) => (
          <motion.div key={i} className="pointer-events-none absolute rounded-full"
            style={{ width: o.w, height: o.h, top: o.top, left: o.left,
              background: "radial-gradient(circle, rgba(10,143,92,0.09) 0%, rgba(10,143,92,0) 70%)" }}
            animate={{ scale: [1, 1.13, 1], opacity: [0.45, 0.9, 0.45] }}
            transition={{ duration: o.dur, delay: o.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        {/* grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.7) 1px,transparent 1px)", backgroundSize: "48px 48px" }}
        />

        {/* logo */}
        <motion.div className="relative mb-10 flex items-center gap-3"
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        >
          <motion.div className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(10,143,92,0.15)", border: "1px solid rgba(10,143,92,0.3)" }}
            animate={{ boxShadow: ["0 0 0px rgba(10,143,92,0)","0 0 18px rgba(10,143,92,0.4)","0 0 0px rgba(10,143,92,0)"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Dumbbell className="h-4 w-4" style={{ color: "#0a8f5c" }} />
          </motion.div>
          <span className="text-[17px] font-bold tracking-tight text-white">Club Manager 360</span>
          <span className="rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(10,143,92,0.15)", border: "1px solid rgba(10,143,92,0.3)", color: "#4cd4a0" }}>
            Gym SaaS
          </span>
        </motion.div>

        {/* browser mockup + features */}
        <div className="relative flex flex-1 items-start gap-8">
          <div className="min-w-0 flex-1" style={{ paddingRight: 20 }}>
            <BrowserMockup phase={phase} />
          </div>
          <div className="w-44 shrink-0 pt-1">
            {FEATURES.map(({ icon: Icon, label, desc }, i) => (
              <motion.div key={label} className="mb-4 flex items-start gap-3"
                initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.7 + i * 0.08, ease: "easeOut" }}
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ background: "rgba(10,143,92,0.15)" }}>
                  <Icon size={12} style={{ color: "#4cd4a0" }} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white leading-tight">{label}</p>
                  <p className="mt-0.5 text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* headline */}
        <motion.div className="relative mt-10"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white">
            Run your gym<br />
            <span style={{ color: "#18b077" }}>smarter, not harder.</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Members · Billing · Attendance · Courts — all in one place.
          </p>
        </motion.div>

        <motion.p className="relative mt-5 text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
        >
          Club Manager 360 · Pakistan · 2026
        </motion.p>
      </div>

      {/* ══════ RIGHT — login form ══════ */}
      <div
        className="relative flex w-full flex-col lg:w-[45%]"
        style={{ background: "#f5f3ef" }}
      >
        {/* mobile logo bar */}
        <div className="flex items-center gap-2.5 border-b px-6 py-4 lg:hidden"
          style={{ background: "#0d1117", borderColor: "rgba(10,143,92,0.3)" }}
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(10,143,92,0.2)" }}>
            <Dumbbell className="h-4 w-4" style={{ color: "#4cd4a0" }} />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">Club Manager 360</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-10 py-12">
          <motion.div
            className="w-full max-w-[360px]"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
          >
            {/* heading */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold tracking-tight text-gray-900">Welcome back!</h2>
              <p className="mt-2 text-sm text-gray-500">Please enter your details to continue.</p>
            </div>

            {/* error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Email
                </label>
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  placeholder="admin@yourgym.com" required
                  className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#0a8f5c] focus:outline-none focus:ring-2 focus:ring-[#0a8f5c]/20 transition-colors"
                />
              </div>

              {/* password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password" name="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••" required
                    className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-11 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#0a8f5c] focus:outline-none focus:ring-2 focus:ring-[#0a8f5c]/20 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* remember + contact */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2.5" onClick={() => setRemember(v => !v)}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, cursor: "pointer", flexShrink: 0,
                    background: remember ? "#0a8f5c" : "white",
                    border: remember ? "none" : "2px solid #d1d5db",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                  }}>
                    {remember && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 select-none">Remember me</span>
                </label>
                <span className="cursor-default text-sm font-medium" style={{ color: "#0a8f5c" }}>
                  Forgot password?
                </span>
              </div>

              {/* submit */}
              <motion.button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                style={{ background: "#0a8f5c" }}
                whileHover={{ scale: 1.015, background: "#18b077" }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {loading ? "Signing in…" : "Log in"}
              </motion.button>
            </form>

            <p className="mt-7 text-center text-sm text-gray-400">
              Don&apos;t have an account?{" "}
              <span className="font-medium text-gray-600">Contact your administrator</span>
            </p>
          </motion.div>
        </div>
      </div>

    </div>
  )
}
