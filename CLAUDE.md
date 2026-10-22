# Club Manager 360 (GymKhana)

Multi-tenant SaaS platform for managing gyms/clubs in Pakistan, marketed as "GymKhana — Gym Management Made Simple" (see `pitch/gymkhana-pitch.html`, `Sales/`). Tagline: "Pakistan's First Gym Software with KuickPay BPS." Handles members, billing/invoicing, attendance, staff/trainers, class scheduling, and sports-court booking. Sold under three platform plan tiers: `OFFLINE`, `SELF_HOSTED`, `SAAS`.

## Tech Stack

- **Next.js 15.5.24** (upgraded 2026-10-22 from 14.2.35 to patch two critical RCE CVEs — GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4), App Router (`src/app`), route groups `(auth)`, `(dashboard)`, `(member)`. Dev script uses `--turbopack`.
- **React 19** (upgraded alongside Next 15 — the officially paired version), TypeScript 5.
- **Prisma 7.8.0** — uses the newer `prisma-client` generator (not `prisma-client-js`) with a custom output path at `src/generated/prisma` (generated code, regenerate with `npx prisma generate` after pulling schema changes). Connects via `@prisma/adapter-pg` + `pg` driver adapter against PostgreSQL.
- **Styling**: Tailwind CSS 3.4, shadcn (style `base-nova`, `components.json`), `@base-ui/react`, Radix primitives, `class-variance-authority`, `cmdk`, `lucide-react`, `framer-motion`, `recharts`.
- **Auth — two independent systems, deliberately kept separate:**
  - **Staff/super-admin**: custom JWT session — `bcryptjs` for hashing, `jose` for signing (HS256, 7-day expiry). Cookie `cm360_token` (httpOnly, secure in prod). `src/middleware.ts` gates `/dashboard/*` (tenant staff) and `/admin/*` (super admin), redirecting based on role.
  - **Members** (`src/lib/member-auth/`): OTP-only (no password), email-based. Cookie `cm360_member_token` — distinct payload shape, distinct verify function, same `JWT_SECRET` but can never be confused with a staff session. `src/middleware.ts` also gates `/portal/*` and `/member-login` on this separate session. See "Member Portal" section below.
- **Transactional email**: Resend (`resend` npm package), `RESEND_API_KEY`/`RESEND_FROM_EMAIL` env vars, sending domain `meyvnlabs.com` (verified).

## Directory Structure

- `src/app/(auth)/login` — unified login for tenant staff and super admins; role determines post-login redirect.
- `src/app/(dashboard)/dashboard/*` — tenant console: members, branches, trainers, plans, billing, attendance, classes, courts, bookings, staff, reports, settings (`general`, `facilities`, `kuickpay`).
- `src/app/admin/*` — platform super-admin console: admins, tenants (incl. subscription editing), platform plans, billing, cross-tenant members.
- `src/app/(member)/member-login`, `src/app/(member)/portal/*` — member-facing portal (`invoices`, `classes`, `courts`, `progress`). See "Member Portal" section below.
- `src/app/api/*` — Route Handlers for all of the above, plus `cron/billing` (bearer-token protected, runs `runBillingCycle()`), `kuickpay/[slug]/{inquiry,payment}` (bank webhook pair), and `api/member/*` (member-facing endpoints, separate from staff `api/*` routes).
- `src/components` — shared UI (`ui/` shadcn primitives, charts, sidebar/topbar/bottom-nav, command palette, QR/barcode scan widgets, `member-portal-topbar.tsx`, `book-class-button.tsx`, `book-court-button.tsx`, `log-progress-form.tsx`).
- `src/lib` — `db/prisma.ts` (client singleton), `auth/` (staff jwt/password/session), `member-auth/` (member jwt/session/otp/email-sending), `billing.ts` (platform billing cycle + auto-suspend), `kuickpay-no.ts` (BPS consumer number generation), `facilities.ts`, `dashboard-nav.ts` (role/module-gated nav config).
- `prisma/schema.prisma`, `prisma/seed.ts` (`npm run seed`), `prisma/migrations/`.
- `docs/member-portal-plan.md` — living sprint-tracking doc for the member portal feature (status, checkboxes, architecture decisions, deploy gotchas). Read this before touching anything member-portal-related.

## Data Model (prisma/schema.prisma)

- **Platform-level**: `SuperAdmin`, `PlatformPlan`, `PlatformInvoice`.
- **Tenant/core**: `Tenant` (gym; module flags `moduleGym`/`moduleCourts`, subscription status, KuickPay institution ID), `Branch`, `Member`, `MembershipPlan`, `PlanFacility`, `Membership`, `Invoice`, `Attendance`.
- **Staff/trainers**: `Staff` (roles `OWNER/ADMIN/MANAGER/STAFF/TRAINER`), `StaffBranch`, `TrainerSlot`, `TrainerMemberAssignment`, `TrainerAttendance`.
- **Facilities/classes/courts**: `TenantFacility`, `ClassSchedule`, `ClassBooking`, `Court`, `SlotBooking`.
- **Health tracking**: `MemberHealth`, `ProgressEntry`, `ProgressReport`.
- **Member portal identity** (added 2026-10-22): `MemberAccount` (login identity, independent of any gym), `MemberOtp` (OTP codes), `MemberGymLink` (join table with history — `accountId`+`tenantId`+`memberId`, `status` ACTIVE/FROZEN/LEFT, `joinedAt`/`leftAt`). One `MemberAccount` can link to multiple per-tenant `Member` rows, since a person can belong to more than one gym. See "Member Portal" section below.

Every operational model carries `tenantId` with per-tenant unique constraints (e.g. `@@unique([tenantId, email])`). Tenant isolation is enforced at the query layer via the JWT's `tenantId`, not DB-level row security — keep that in mind when adding new routes/queries.

## KuickPay Integration

Real, functioning integration (not just a migration name) with KuickPay, Pakistan's inter-bank Bill Presentment System (BPS):
- `Tenant.kuickpayInstitutionId` (biller code), `Member.consumerNumber` (per-tenant unique BPS lookup key), `Invoice.kuickpayTranAuthId`/`kuickpayBankMnemonic`, `PaymentMethod.KUICKPAY`.
- `src/lib/kuickpay-no.ts` builds numeric BPS consumer numbers.
- `src/app/api/kuickpay/[slug]/inquiry` — Bill Inquiry webhook (resolves tenant by slug, member by consumer number; applies 10% after-due-date surcharge, handles blocked/suspended members).
- `src/app/api/kuickpay/[slug]/payment` — Payment Notification webhook (marks invoices paid).
- Tenant-facing config UI/API at `dashboard/settings/kuickpay` and `api/settings/kuickpay`.

No other third-party payment/comms integrations exist in code (WhatsApp is only mentioned in marketing copy as a manual workflow, not an API integration).

## Member Portal

Second, independent login surface for gym *members* (not staff) — self-service invoices, class/court booking, progress logging. Full history/decisions/open questions in `docs/member-portal-plan.md`; summary:

- **Auth**: email + OTP only (no password, no OAuth yet — deferred). `POST /api/member/auth/send-otp` → `POST /api/member/auth/verify-otp` (first successful verify doubles as signup). Session via `cm360_member_token` cookie.
- **Linking**: a staff member clicks "Invite to Portal" on a member's profile (`POST /api/members/[id]/invite`) → sends an email via Resend. Linking itself is automatic and order-independent: `verify-otp` matches the verified email against `Member` rows across *all* tenants and creates any missing `MemberGymLink`s, so it works whether invite or signup happens first.
- **Pages**: `/member-login` (public), `/portal`, `/portal/invoices`, `/portal/classes`, `/portal/courts`, `/portal/progress` (all gated by `src/middleware.ts` on the member session).
- **KuickPay nuance**: `/portal/invoices` shows payment *instructions* (consumer number + amount), not a "Pay Now" button — KuickPay BPS has no in-app checkout, payment happens on the member's own bank's ATM/app, which then calls the existing webhook.
- **Booking routes** (`/api/member/classes/[id]/book`, `/api/member/courts/[id]/book`) resolve the caller's tenant-scoped `Member.id` server-side from their `MemberGymLink` — never trust a client-supplied `memberId`.
- Progress self-logging reuses the existing `ProgressEntry` model directly (no schema change needed) with `trainerId: null` marking self-logged vs. trainer-authored entries. Requires the member to have at least one active gym link — standalone (no-gym) progress tracking is not supported yet.

## Environment Variables (`.env`)

- `DATABASE_URL` — PostgreSQL connection string. Note: Prisma CLI does **not** auto-load `.env`; `prisma.config.ts` handles loading it.
- `JWT_SECRET` — HMAC secret for session JWTs; falls back to an insecure default if unset — always set explicitly outside local dev.
- `CRON_SECRET` — bearer token required by `GET /api/cron/billing` (not in the sample `.env`; needed in production, e.g. via Vercel Cron).
- `NEXT_PUBLIC_APP_URL` — public base URL, used to construct KuickPay webhook URLs shown to tenants and the member-portal invite-email link. **Verify this is actually a live URL after changing it** — production had this silently set to a dead `*.vercel.app` alias for an unknown period before being caught (2026-10-22) via a broken invite-email link, not via any build/deploy failure.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — Resend transactional email, used for member OTP codes and portal invites. Sending domain `meyvnlabs.com` is verified.

## Production Deployment

- Vercel project `moiz-pashas-projects/culb-manager360`. Production aliases: `club360.meyvnlabs.com` (primary, custom domain) and `culb-manager360-peach.vercel.app` (Vercel-assigned). **Not** `clubmanager360.vercel.app` — that one 404s, don't use it anywhere (it was a stale `NEXT_PUBLIC_APP_URL` value, since fixed).
- Database: Neon Postgres (`neondb`, pooled connection, `*.neon.tech`).
- Deploy with `npx vercel deploy --prod` from the project root (requires `vercel login` once per machine/session — Vercel CLI auth persists in the user profile across sessions).
- **Known deploy gotchas** (hit 2026-10-22, full detail in `docs/member-portal-plan.md` § Production Deploy Notes):
  1. Setting a Vercel env var by piping through PowerShell (`echo "x" | vercel env add ...`) silently injects a UTF-8 BOM into the value even with output-encoding overrides — breaks anything that uses the value in an HTTP header (e.g. Resend's `Authorization: Bearer`). Fix: write the value to a file, then `cmd /c "vercel env add KEY production < file.txt"`.
  2. Neon's pooled connection can leave a stuck Postgres advisory lock, making every `prisma migrate deploy` fail with `P1002` at a consistent 10s timeout. `pg_advisory_unlock_all()` in Neon's SQL Editor does **not** fix it (only releases locks held by that same session) — have to find and `pg_terminate_backend()` the actual blocking PID instead.

## Local Dev Environment Notes

- This machine has **no standalone Node.js/npm install**. A working Node (v24.12.0) + npm (11.6.4) exists bundled inside Visual Studio at:
  `C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs\`
  Prepend that directory to `$env:Path` for the session before running `npm`/`node`/`npx` commands.
- `npm install` and `npx prisma generate` both work fine without a live database.
- **PostgreSQL 17 is now installed locally** (via `winget install PostgreSQL.PostgreSQL.17`), running as Windows service `postgresql-x64-17` on port 5432. Superuser `postgres` / password `password` (matches the sample `.env`). Data directory is at `C:\Users\Moiz Pasha\pgdata\17` (not the default `Program Files` location, since that install path isn't writable without admin elevation). Database `gymkhana` exists and is migrated + seeded — login (e.g. `super@clubmanager360.com` / `super123`) works end-to-end.
- **Known repo issue — migration/schema drift**: as of 2026-07-24, `prisma/schema.prisma` was significantly ahead of `prisma/migrations/` — `Tenant.moduleGym`/`moduleCourts`, `MembershipPlan.priceMode`, `TenantFacility.monthlyFee`, `Invoice.slotBookingId`/`kuickpayConsumerNo`, and entire models `PlanFacility`, `Court`, `SlotBooking`, `MemberHealth`, `ProgressEntry`, `ProgressReport` had no corresponding migration files. Fixed locally via `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` + manual `psql` apply (had to hand-fix one ordering bug in the generated SQL: it tried to `ALTER TABLE "SlotBooking" ALTER COLUMN "paymentStatus"` before the `CREATE TABLE "SlotBooking"` that appears later in the same script — safe to just drop that one line when it recurs, since the table is created fresh with the correct enum already). **This diff was applied directly to the DB, not captured as a proper migration file** — someone should run `prisma migrate dev` interactively (needs a TTY) to generate the real migration and commit it, otherwise this gap will hit any other fresh clone/environment.

## Scripts

- `npm run dev` — start dev server (`next dev --turbopack`).
- `npm run build` — `prisma migrate deploy && prisma generate && next build` (migrations auto-apply on build/deploy).
- `npm run seed` — `tsx prisma/seed.ts`.
- `npm run lint` — `eslint .` (migrated off `next lint`, which is deprecated in Next 15; `eslint.config.mjs` uses `FlatCompat` since `eslint-config-next`'s bundled exports aren't pure flat-config yet — don't revert to a plain `extends: [...nextCoreWebVitals]` array import, it'll throw `nextCoreWebVitals is not iterable`).
