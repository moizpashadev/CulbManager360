import bcrypt from "bcryptjs"

const CODE_LENGTH = 6
export const OTP_EXPIRY_MINUTES = 10
export const OTP_RESEND_COOLDOWN_SECONDS = 60
export const OTP_MAX_PER_HOUR = 5

export function generateOtpCode(): string {
  const max = 10 ** CODE_LENGTH
  const n = Math.floor(Math.random() * max)
  return n.toString().padStart(CODE_LENGTH, "0")
}

export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

export async function verifyOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash)
}
