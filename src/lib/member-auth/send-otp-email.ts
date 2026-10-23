import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@meyvnlabs.com"

export async function sendOtpEmail(email: string, code: string) {
  await resend.emails.send({
    from: `Me360 <${FROM}>`,
    to: email,
    subject: `Your login code: ${code}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0a8f5c;">Your login code</h2>
        <p>Use this code to log in to Me360:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1a1a1a;">${code}</p>
        <p style="color: #737373; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        <p style="color: #a3a3a3; font-size: 12px; margin-top: 24px;">Powered by Club Manager 360</p>
      </div>
    `,
  })
}
