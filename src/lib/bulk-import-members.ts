import { prisma } from "@/lib/db/prisma"

export type ParsedMemberRow = { name: string; mobile: string; email: string }
export type SkippedRow = { row: number; reason: string }

const NAME_HEADERS = ["name", "full name", "member name"]
const MOBILE_HEADERS = ["mobile", "phone", "mobile number", "phone number"]
const EMAIL_HEADERS = ["email", "email address"]

// Minimal, dependency-free CSV parser — handles quoted fields (with
// embedded commas/newlines/escaped quotes) since that's the one thing a
// naive comma-split gets wrong on real-world exports.
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ",") {
      row.push(field); field = ""
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++
      row.push(field); field = ""
      if (row.some((f) => f !== "")) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field)
    if (row.some((f) => f !== "")) rows.push(row)
  }
  return rows
}

// Parses a CSV with Name/Mobile/Email columns (header names matched
// case-insensitively, with a few common aliases). Any other columns in
// the file are ignored — extra per-member detail gets filled in later
// through the normal edit flow, not through this import.
export function parseMembersCsv(text: string): { rows: ParsedMemberRow[]; error?: string } {
  const raw = parseCsv(text.trim())
  if (raw.length === 0) return { rows: [], error: "File is empty" }

  const header = raw[0].map((h) => h.trim().toLowerCase())
  const nameIdx = header.findIndex((h) => NAME_HEADERS.includes(h))
  const mobileIdx = header.findIndex((h) => MOBILE_HEADERS.includes(h))
  const emailIdx = header.findIndex((h) => EMAIL_HEADERS.includes(h))

  if (nameIdx === -1 || mobileIdx === -1 || emailIdx === -1) {
    return { rows: [], error: "File must have Name, Mobile, and Email columns" }
  }

  const rows = raw.slice(1).map((r) => ({
    name: (r[nameIdx] ?? "").trim(),
    mobile: (r[mobileIdx] ?? "").trim(),
    email: (r[emailIdx] ?? "").trim(),
  }))
  return { rows }
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/)
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") }
}

// Creates one Member per valid row for the given tenant. Only
// Name/Mobile/Email are required — everything else (CNIC, branch,
// emergency contact, etc.) is left blank, for staff to fill in later per
// member, since different clients need different extra fields. Processed
// sequentially (not in parallel) so the auto-incrementing consumer number
// stays unique within the batch.
export async function bulkCreateMembers(
  tenantId: string,
  rows: ParsedMemberRow[]
): Promise<{ created: number; skipped: SkippedRow[] }> {
  let nextSeq = (await prisma.member.count({ where: { tenantId } })) + 1
  const skipped: SkippedRow[] = []
  let created = 0

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2 // 1-indexed + header row
    const { name, mobile, email } = rows[i]

    if (!name || !mobile || !email) {
      skipped.push({ row: rowNum, reason: "Missing name, mobile, or email" })
      continue
    }
    const normalizedEmail = email.toLowerCase()
    const { firstName, lastName } = splitName(name)
    if (!firstName) {
      skipped.push({ row: rowNum, reason: "Missing name" })
      continue
    }

    const existing = await prisma.member.findFirst({
      where: { tenantId, email: normalizedEmail },
      select: { id: true },
    })
    if (existing) {
      skipped.push({ row: rowNum, reason: `Email already exists (${normalizedEmail})` })
      continue
    }

    try {
      await prisma.member.create({
        data: {
          tenantId,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: mobile,
          consumerNumber: String(nextSeq).padStart(7, "0"),
        },
      })
      nextSeq++
      created++
    } catch {
      skipped.push({ row: rowNum, reason: "Could not create member (duplicate or invalid data)" })
    }
  }

  return { created, skipped }
}
