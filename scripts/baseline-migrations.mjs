// One-time fix: the production database's tables already existed without
// Prisma's migration-history bookkeeping table being populated (P3005).
// This marks the pre-existing migrations as already applied (no SQL runs,
// only a record is written) so `prisma migrate deploy` can proceed to apply
// only the genuinely new migration. Safe to remove after the next
// successful deploy.
import { execSync } from "node:child_process"

const ALREADY_APPLIED = [
  "20260618101421_init",
  "20260618105137_add_staff_auth",
  "20260618110919_add_super_admin_and_tenant_fields",
  "20260618130730_add_classes",
  "20260618183931_billing_enhancements",
  "20260618185457_branches_and_trainers",
  "20260618200000_facilities",
  "20260622000000_kuickpay_integration",
  "20260623000000_platform_plans",
]

for (const name of ALREADY_APPLIED) {
  try {
    execSync(`npx prisma migrate resolve --applied ${name}`, { stdio: "inherit" })
  } catch {
    console.log(`(skipping ${name} — likely already resolved)`)
  }
}
