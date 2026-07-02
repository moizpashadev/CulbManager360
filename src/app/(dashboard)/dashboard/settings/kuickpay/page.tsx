import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db/prisma"
import { KuickpaySettingsForm } from "./kuickpay-settings-form"

export default async function KuickpaySettingsPage() {
  const session = await getSession()
  if (!session) redirect("/login")
  if (!["OWNER", "ADMIN"].includes(session.role)) redirect("/dashboard")

  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } })
  if (!tenant) redirect("/dashboard")

  const host = process.env.NEXT_PUBLIC_APP_URL ?? "https://your-domain.com"

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Kuickpay BPS Integration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your gym&apos;s integration with Kuickpay Bill Payment System.
          Share the endpoint URLs below with the Kuickpay onboarding team.
        </p>
      </div>

      {/* Endpoint URLs */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Your Merchant Endpoints</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Provide these URLs to Kuickpay during onboarding. They will call these endpoints for bill lookups and payment confirmations.
          </p>
        </div>
        <div className="divide-y divide-border">
          <div className="px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Bill Inquiry URL
            </p>
            <code className="block rounded bg-muted/60 px-3 py-2 font-mono text-sm text-foreground select-all">
              POST {host}/api/kuickpay/{tenant.slug}/inquiry
            </code>
          </div>
          <div className="px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Bill Payment URL
            </p>
            <code className="block rounded bg-muted/60 px-3 py-2 font-mono text-sm text-foreground select-all">
              POST {host}/api/kuickpay/{tenant.slug}/payment
            </code>
          </div>
        </div>
      </div>

      {/* Institution ID form */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">Institution Configuration</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your Institution ID is provided by Kuickpay after onboarding. It is used in consumer number lookups.
          </p>
        </div>
        <div className="p-6">
          <KuickpaySettingsForm
            tenantId={tenant.id}
            currentInstitutionId={tenant.kuickpayInstitutionId ?? ""}
          />
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-border bg-white shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-sm font-semibold text-foreground">How It Works</h2>
        </div>
        <div className="divide-y divide-border text-sm text-muted-foreground">
          {[
            {
              step: "1",
              title: "Consumer Inquiry",
              desc: "When a customer enters your consumer number at any bank/app, Kuickpay calls your Bill Inquiry endpoint to fetch the outstanding bill.",
            },
            {
              step: "2",
              title: "Payment Advice",
              desc: "After the customer confirms payment, Kuickpay calls your Bill Payment endpoint. Club Manager 360 automatically marks the invoice as paid.",
            },
            {
              step: "3",
              title: "Consumer Numbers",
              desc: "Each member is auto-assigned a unique 7-digit consumer number (visible on their profile). Share this with your customers for Kuickpay payments.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 px-6 py-4">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {step}
              </div>
              <div>
                <p className="font-medium text-foreground">{title}</p>
                <p className="mt-0.5 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
