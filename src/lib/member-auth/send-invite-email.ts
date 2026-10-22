import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@meyvnlabs.com"

export async function sendInviteEmail(email: string, firstName: string, gymName: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const loginUrl = `${appUrl}/member-login`

  await resend.emails.send({
    from: `Club Manager 360 <${FROM}>`,
    to: email,
    subject: `${gymName} invited you to the member portal`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0a8f5c;">Hi ${firstName},</h2>
        <p><strong>${gymName}</strong> has set you up with access to the member portal — view your invoices, attendance, and progress, and book classes and courts yourself.</p>
        <p>
          <a href="${loginUrl}" style="display: inline-block; background: #0a8f5c; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Log in to your portal
          </a>
        </p>
        <p style="color: #737373; font-size: 14px;">Just use this email address — we'll send you a one-time code, no password needed.</p>
      </div>
    `,
  })
}
