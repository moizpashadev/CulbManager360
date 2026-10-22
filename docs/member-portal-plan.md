# Member Portal — Implementation Plan

**Status:** Sprint 1 in progress
**Last updated:** 2026-10-22

**Scope decision (2026-10-22):** Google/Facebook OAuth signup is **deferred** — not required to deliver core value (gym members logging in to see their own data). Sprint 1 ships with **invite + email OTP only**. OAuth moves to a later/optional addition once there's reason to prioritize the standalone-signup growth loop. See section 5.

This tracks the plan to add a member-facing portal to Club Manager 360. Today, the only logins are staff-side (`OWNER`/`ADMIN`/`MANAGER`/`STAFF`/`TRAINER`). This adds a second, separate login surface for gym *members* themselves.

Update the checkboxes as work lands. Keep "Last updated" current.

---

## 1. Product Decisions (confirmed)

- **Two registration paths, one funnel:**
  1. **Invite-only** — a gym owner/admin invites an existing `Member` by email. The member logs in via **email + OTP** (no password to manage), since their data already exists in the system.
  2. **Standalone signup** — anyone can sign up directly (email, Google OAuth, Facebook OAuth) *without* being linked to a gym, purely to track their own health/progress. This doubles as a top-of-funnel acquisition channel: if their gym later adopts Club Manager 360, the accounts link instead of duplicating.
- **Account linking:** if a gym invites an email that already has a standalone account, the system detects the match and **links** the existing account to that gym's `Member` record — it does not create a duplicate identity.
- **Multi-gym history:** a person can be a member of more than one gym over time (or move between gyms, both on Club Manager 360). The portal shows a history: which gym, joined date, left date. This means membership/identity needs to be modeled as **one person → many gym memberships over time**, not one row per gym.
- **Platform:** Phase 1 is a **PWA** (installable on iPhone/Android from the browser, no app store). Phase 2 (only if there's real consumer traction) is a native cross-platform app, reusing the same API since the backend is being built API-first from day one.

## 2. Feature Scope (confirmed)

- [ ] View own invoices / payment status
- [ ] **Pay invoices in-app** (via existing KuickPay integration — not just view status)
- [ ] Book classes themselves
- [ ] Book courts themselves
- [ ] View own attendance history
- [ ] View health/progress reports (trainer-authored)
- [ ] **Self-log weekly measurements & weight** (maps to existing `ProgressEntry` model — weight, chest, waist, hips, bicep, thigh, shoulders)
- [ ] Goal + progress visualization (uses existing `MemberHealth.goal` / `targetWeight`)
- [ ] Self-service QR check-in (member shows their own QR; builds on existing `/api/members/[id]/qr`)
- [ ] Push notifications (class reminders, payment due, attendance streaks) — the actual reason to do PWA over a plain site
- [ ] "Find your gym" linking flow for standalone users (search/QR-scan via `Tenant.slug`)
- [ ] Referral (member → friend, either to the gym or to the app itself)

## 3. Architecture Note — Member Identity Model (⚠️ needs confirmation before Sprint 1 starts)

**Problem:** today's `Member` model is tenant-scoped — one row per gym, `@@unique([tenantId, email])`. It conflates "this person" with "this person's record at this one gym." That's fine for staff-managed data entry, but breaks the moment one person needs:
- A single login across gyms (and standalone, with no gym at all)
- A history of which gyms they joined/left and when

**Proposed direction** (sketch — refine during Sprint 1 design, not final):

**✅ Implemented (2026-10-22)** — actual schema, in `prisma/schema.prisma`:

- `MemberAccount` — login identity (`email` unique, optional `oauthGoogleId`/`oauthFbId` for later). No password field — OTP-only for now.
- `MemberOtp` — short-lived OTP codes (`codeHash`, `expiresAt`, `consumedAt`), keyed by email, not tied to an account yet (so it can validate before an account exists, for first-time signup).
- `MemberGymLink` — the history/bridge table: `accountId` + `tenantId` + `memberId`, `status` (`ACTIVE`/`FROZEN`/`LEFT`), `joinedAt`/`leftAt`. One row per person-per-gym relationship over time.
- Existing `Member` rows are untouched — all tenant-scoped operational data (plans, invoices, attendance) still keys off `Member.id`/`tenantId` exactly as before.

**Migration:** applied properly via a real committed migration file — `prisma/migrations/20261022140000_add_member_account_and_gym_link/migration.sql` — generated with `prisma migrate diff` (since `prisma migrate dev` needs an interactive TTY this environment doesn't have) and applied with `prisma migrate deploy`, so it's tracked in `_prisma_migrations` like every other migration. This is the fix for the pattern that caused the Court/SlotBooking gap — not another live-patched diff.

**Deferred to Sprint 2:** `ProgressEntry.accountId` (nullable, for self-logged entries including standalone/no-gym users) — not added yet, since self-logging is Sprint 2 scope.

## 4. Sprint Plan

### Sprint 1 — Auth, Identity & Read-Only Views
- [x] Design/confirm `MemberAccount` + `MemberGymLink` + `MemberOtp` schema (section 3), write real migration
- [x] Pick email OTP delivery provider → **Resend**, domain `meyvnlabs.com` verified, test send confirmed working
- [x] `RESEND_API_KEY` + `RESEND_FROM_EMAIL` added to local `.env` (⚠️ still needs adding to Vercel prod env vars before deploy)
- [x] `resend` npm package installed
- [ ] ~~Google OAuth signup/login~~ — deferred, see scope decision above
- [ ] ~~Facebook OAuth signup/login~~ — deferred, see scope decision above
- [x] OTP send endpoint — `POST /api/member/auth/send-otp` (6-digit code, bcrypt-hashed into `MemberOtp`, emailed via Resend, 60s resend cooldown + 5/hour cap, both enforced via DB lookups)
- [x] OTP verify endpoint — `POST /api/member/auth/verify-otp` (checks code, marks OTP consumed so it can't be replayed, upserts `MemberAccount` — first successful verify doubles as signup — issues member session)
- [x] Member-side session/auth — `src/lib/member-auth/{jwt,session,otp,send-otp-email}.ts`, separate cookie `cm360_member_token` (distinct from staff `cm360_token`), same JWT_SECRET but distinct payload shape/verify function so the two can never be confused
- [x] Tested live: real email delivery confirmed, cooldown/rate-limit, wrong-code rejection, replay-after-consumption rejection, invalid-email-format rejection, and the full success path (session issued, account not duplicated on re-verify) — all tested against the real endpoints, not just unit logic
- [ ] Invite flow: gym owner/admin invites a `Member` by email → auto-match to existing `MemberAccount` if one exists (creates `MemberGymLink`), else prompts first-time OTP signup
- [ ] New route group, e.g. `src/app/(member)/portal/*`, isolated from `/dashboard` — **note: no actual portal pages exist yet**, `verify-otp` currently redirects to `/portal` which doesn't exist as a route yet
- [ ] Read-only: own profile, invoices/payment status, attendance history, health/progress reports
- [ ] Multi-gym history view (joined/left dates per gym, from `MemberGymLink`)

### Sprint 2 — Self-Service Actions
- [ ] Pay invoice in-app via KuickPay
- [ ] Book a class
- [ ] Book a court slot
- [ ] Self-log weekly measurements/weight (writes `ProgressEntry`)

### Sprint 3 — Engagement Layer
- [ ] Push notifications (service worker, VAPID keys, reminder triggers — class reminders, payment due, attendance streaks)
- [ ] Self-service QR check-in screen
- [ ] Goal + progress visualization (chart against `MemberHealth.targetWeight`/goal)
- [ ] "Find your gym" linking flow (search/QR by `Tenant.slug`) for standalone users
- [ ] Referral flow
- [ ] PWA polish: install prompts, offline caching (today's schedule, QR code available offline)

## 5. Open Questions / Decisions Needed

- [x] **Email OTP delivery provider** — Resend, `meyvnlabs.com` domain verified, test send confirmed (2026-10-22)
- [x] `MemberGymLink.status` states — settled on `ACTIVE` / `FROZEN` / `LEFT` (FROZEN added to match the existing membership-pause feature)
- [ ] **Google OAuth app** — deferred (not currently planned for Sprint 1/2/3; revisit if standalone growth loop becomes a priority). When revisited: needs a Google Cloud project + Client ID/Secret, created by the account owner — only those two values are needed from the user side.
- [ ] **Facebook OAuth app** — same as above, deferred. Needs a Meta for Developers app + App ID/Secret when revisited.
- [ ] **Push notifications** — needs VAPID key pair + service worker registration strategy (Sprint 3)
- [ ] Should standalone (no-gym) users have any limits vs. gym-linked users, or is the feature set identical minus gym-specific data?

## 6. Non-Goals (for now)

- Native app (explicitly phase 2, only pursued if standalone/consumer side gets real traction)
- Social/leaderboard features (flagged as possible future addition, not in scope for these 3 sprints)
