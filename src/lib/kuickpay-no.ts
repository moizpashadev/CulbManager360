/**
 * Generates a KuickPay BPS consumer number.
 *
 * Member invoices: prefix + memberConsumerNumber padded to 10 digits
 *   e.g. prefix=00960, consumerNo=0000001 → 009600000000001
 *
 * Walk-in / no-member bookings: prefix + "9" + last-9-digits of Unix ms timestamp
 *   e.g. prefix=00960, ts=...123456789 → 009609123456789
 *
 * The result is always fully numeric, matching KuickPay BPS requirements.
 */
export function buildKuickpayConsumerNo(
  prefix: string | null | undefined,
  memberConsumerNo: string | null | undefined,
): string {
  const p = (prefix ?? "00960").replace(/\D/g, "")

  if (memberConsumerNo) {
    const num = memberConsumerNo.replace(/\D/g, "")
    return `${p}${num.padStart(10, "0")}`
  }

  // Walk-in: unique timestamp-based suffix (9 digits, right-aligned)
  const ts = Date.now().toString().slice(-9)
  return `${p}9${ts}`
}
