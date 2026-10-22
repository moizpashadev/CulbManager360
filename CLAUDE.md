# Club Manager 360 (GymKhana)

Multi-tenant SaaS platform for managing gyms/clubs in Pakistan, marketed as "GymKhana — Gym Management Made Simple" (see `pitch/gymkhana-pitch.html`, `Sales/`). Tagline: "Pakistan's First Gym Software with KuickPay BPS." Handles members, billing/invoicing, attendance, staff/trainers, class scheduling, and sports-court booking. Sold under three platform plan tiers: `OFFLINE`, `SELF_HOSTED`, `SAAS`.

## Tech Stack

- **Next.js 14.2.35**, App Router (`src/app`), route groups `(auth)` and `(dashboard)`.
- **React 18**, TypeScript 5.
- **Prisma 7.8.0** — uses the newer `prisma-client` generator (not `prisma-client-js`) with a custom output path at `src/generated/prisma` (generated code, regenerate with `npx prisma generate` after pulling schema changes). Connects via `@prisma/adapter-pg` + `pg` driver adapter against PostgreSQL.
- **Styling**: Tailwind CSS 3.4, shadcn (style `base-nova`, `components.json`), `@base-ui/react`, Radix primitives, `class-variance-authority`, `cmdk`, `lucide-react`, `framer-motion`, `recharts`.
- **Auth**: custom JWT session (not NextAuth) — `bcryptjs` for hashing, `jose` for signing (HS256, 7-day expiry). Cookie `cm360_token` (httpOnly, secure in prod). `src/middleware.ts` gates `/dashboard/*` (tenant staff) and `/admin/*` (super admin), redirecting based on role.

## Directory Structure

- `src/app/(auth)/login` — unified login for tenant staff and super admins; role determines post-login redirect.
- `src/app/(dashboard)/dashboard/*` — tenant console: members, branches, trainers, plans, billing, attendance, classes, courts, bookings, staff, reports, settings (`general`, `facilities`, `kuickpay`).
- `src/app/admin/*` — platform super-admin console: admins, tenants (incl. subscription editing), platform plans, billing, cross-tenant members.
- `src/app/api/*` — Route Handlers for all of the above, plus `cron/billing` (bearer-token protected, runs `runBillingCycle()`) and `kuickpay/[slug]/{inquiry,payment}` (bank webhook pair).
- `src/components` — shared UI (`ui/` shadcn primitives, charts, sidebar/topbar/bottom-nav, command palette, QR/barcode scan widgets).
- `src/lib` — `db/prisma.ts` (client singleton), `auth/` (jwt/password/session), `billing.ts` (platform billing cycle + auto-suspend), `kuickpay-no.ts` (BPS consumer number generation), `facilities.ts`, `dashboard-nav.ts` (role/module-gated nav config).
- `prisma/schema.prisma`, `prisma/seed.ts` (`npm run seed`), `prisma/migrations/`.

## Data Model (prisma/schema.prisma)

- **Platform-level**: `SuperAdmin`, `PlatformPlan`, `PlatformInvoice`.
- **Tenant/core**: `Tenant` (gym; module flags `moduleGym`/`moduleCourts`, subscription status, KuickPay institution ID), `Branch`, `Member`, `MembershipPlan`, `PlanFacility`, `Membership`, `Invoice`, `Attendance`.
- **Staff/trainers**: `Staff` (roles `OWNER/ADMIN/MANAGER/STAFF/TRAINER`), `StaffBranch`, `TrainerSlot`, `TrainerMemberAssignment`, `TrainerAttendance`.
- **Facilities/classes/courts**: `TenantFacility`, `ClassSchedule`, `ClassBooking`, `Court`, `SlotBooking`.
- **Health tracking**: `MemberHealth`, `ProgressEntry`, `ProgressReport`.

Every operational model carries `tenantId` with per-tenant unique constraints (e.g. `@@unique([tenantId, email])`). Tenant isolation is enforced at the query layer via the JWT's `tenantId`, not DB-level row security — keep that in mind when adding new routes/queries.

## KuickPay Integration

Real, functioning integration (not just a migration name) with KuickPay, Pakistan's inter-bank Bill Presentment System (BPS):
- `Tenant.kuickpayInstitutionId` (biller code), `Member.consumerNumber` (per-tenant unique BPS lookup key), `Invoice.kuickpayTranAuthId`/`kuickpayBankMnemonic`, `PaymentMethod.KUICKPAY`.
- `src/lib/kuickpay-no.ts` builds numeric BPS consumer numbers.
- `src/app/api/kuickpay/[slug]/inquiry` — Bill Inquiry webhook (resolves tenant by slug, member by consumer number; applies 10% after-due-date surcharge, handles blocked/suspended members).
- `src/app/api/kuickpay/[slug]/payment` — Payment Notification webhook (marks invoices paid).
- Tenant-facing config UI/API at `dashboard/settings/kuickpay` and `api/settings/kuickpay`.

No other third-party payment/comms integrations exist in code (WhatsApp is only mentioned in marketing copy as a manual workflow, not an API integration).

## Environment Variables (`.env`)

- `DATABASE_URL` — PostgreSQL connection string. Note: Prisma CLI does **not** auto-load `.env`; `prisma.config.ts` handles loading it.
- `JWT_SECRET` — HMAC secret for session JWTs; falls back to an insecure default if unset — always set explicitly outside local dev.
- `CRON_SECRET` — bearer token required by `GET /api/cron/billing` (not in the sample `.env`; needed in production, e.g. via Vercel Cron).
- `NEXT_PUBLIC_APP_URL` — public base URL, used to construct KuickPay webhook URLs shown to tenants.

## Local Dev Environment Notes

- This machine has **no standalone Node.js/npm install**. A working Node (v24.12.0) + npm (11.6.4) exists bundled inside Visual Studio at:
  `C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs\`
  Prepend that directory to `$env:Path` for the session before running `npm`/`node`/`npx` commands.
- `npm install` and `npx prisma generate` both work fine without a live database.
- **PostgreSQL 17 is now installed locally** (via `winget install PostgreSQL.PostgreSQL.17`), running as Windows service `postgresql-x64-17` on port 5432. Superuser `postgres` / password `password` (matches the sample `.env`). Data directory is at `C:\Users\Moiz Pasha\pgdata\17` (not the default `Program Files` location, since that install path isn't writable without admin elevation). Database `gymkhana` exists and is migrated + seeded — login (e.g. `super@clubmanager360.com` / `super123`) works end-to-end.
- **Known repo issue — migration/schema drift**: as of 2026-07-24, `prisma/schema.prisma` was significantly ahead of `prisma/migrations/` — `Tenant.moduleGym`/`moduleCourts`, `MembershipPlan.priceMode`, `TenantFacility.monthlyFee`, `Invoice.slotBookingId`/`kuickpayConsumerNo`, and entire models `PlanFacility`, `Court`, `SlotBooking`, `MemberHealth`, `ProgressEntry`, `ProgressReport` had no corresponding migration files. Fixed locally via `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` + manual `psql` apply (had to hand-fix one ordering bug in the generated SQL: it tried to `ALTER TABLE "SlotBooking" ALTER COLUMN "paymentStatus"` before the `CREATE TABLE "SlotBooking"` that appears later in the same script — safe to just drop that one line when it recurs, since the table is created fresh with the correct enum already). **This diff was applied directly to the DB, not captured as a proper migration file** — someone should run `prisma migrate dev` interactively (needs a TTY) to generate the real migration and commit it, otherwise this gap will hit any other fresh clone/environment.

## Scripts

- `npm run dev` — start dev server.
- `npm run build` — `prisma migrate deploy && prisma generate && next build` (migrations auto-apply on build/deploy).
- `npm run seed` — `tsx prisma/seed.ts`.
- `npm run lint` — `next lint`.
