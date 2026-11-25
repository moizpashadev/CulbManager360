import { chromium } from "playwright"
import { mkdirSync } from "fs"

const BASE = "http://localhost:3000"
const OUT = "marketing-screenshots"
mkdirSync(OUT, { recursive: true })

const STAFF_COOKIE = process.env.STAFF_COOKIE
const MEMBER_COOKIE = process.env.MEMBER_COOKIE

const staffShots = [
  ["01-dashboard-overview", "/dashboard"],
  ["02-members-list", "/dashboard/members"],
  ["03-member-profile", "/dashboard/members/mem-15"],
  ["04-membership-plans", "/dashboard/plans"],
  ["05-billing-invoices", "/dashboard/billing"],
  ["06-billing-detail", "/dashboard/billing/inv-ms-ms-15"],
  ["07-attendance", "/dashboard/attendance"],
  ["08-staff-roles", "/dashboard/staff"],
  ["09-trainers-list", "/dashboard/trainers"],
  ["10-trainer-detail", "/dashboard/trainers/trainer-ali"],
  ["11-class-schedule", "/dashboard/classes"],
  ["12-courts", "/dashboard/courts"],
  ["13-bookings", "/dashboard/bookings"],
  ["14-reports-revenue", "/dashboard/reports"],
  ["15-branches", "/dashboard/branches"],
]

const memberShots = [
  ["16-me360-home", "/portal"],
  ["17-me360-checkin-qr", "/portal/checkin"],
  ["18-me360-classes", "/portal/classes"],
  ["19-me360-courts", "/portal/courts"],
  ["20-me360-invoices", "/portal/invoices"],
  ["21-me360-progress", "/portal/progress"],
  ["22-me360-find-gym", "/portal/find-gym"],
  ["23-me360-referral", "/portal/referral"],
  ["24-me360-more", "/portal/more"],
]

async function run() {
  const browser = await chromium.launch()

  // Staff dashboard — desktop viewport
  const staffContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  await staffContext.addCookies([
    {
      name: "cm360_token",
      value: STAFF_COOKIE,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ])
  const staffPage = await staffContext.newPage()
  for (const [name, path] of staffShots) {
    try {
      await staffPage.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 })
      await staffPage.waitForTimeout(500)
      await staffPage.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
      console.log(`OK  ${name}  <-  ${path}`)
    } catch (err) {
      console.log(`FAIL ${name}  <-  ${path}  (${err.message.split("\n")[0]})`)
    }
  }
  await staffContext.close()

  // Member portal (Me360) — mobile viewport
  const memberContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  })
  await memberContext.addCookies([
    {
      name: "cm360_member_token",
      value: MEMBER_COOKIE,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ])
  const memberPage = await memberContext.newPage()
  for (const [name, path] of memberShots) {
    try {
      await memberPage.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 })
      await memberPage.waitForTimeout(500)
      await memberPage.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
      console.log(`OK  ${name}  <-  ${path}`)
    } catch (err) {
      console.log(`FAIL ${name}  <-  ${path}  (${err.message.split("\n")[0]})`)
    }
  }
  await memberContext.close()

  await browser.close()
}

run()
