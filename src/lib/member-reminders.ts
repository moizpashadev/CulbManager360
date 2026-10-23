import { prisma } from "@/lib/db/prisma"
import { sendPushToAccount } from "@/lib/member-auth/send-push"

const STREAK_MIN_DAYS = 3 // only nudge once a real streak is building, not after one visit

function startOfDay(d: Date) {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function dateKey(d: Date) {
  return startOfDay(d).toISOString().slice(0, 10)
}

function fmt(n: unknown) {
  return `PKR ${Number(n).toLocaleString("en-PK")}`
}

// Counts consecutive calendar days (ending yesterday) with at least one
// Attendance record, for a single member. Dates are pre-sorted descending.
function currentStreak(attendanceDates: Date[]): number {
  if (attendanceDates.length === 0) return 0
  const days = new Set(attendanceDates.map(dateKey))
  let streak = 0
  const cursor = startOfDay(new Date())
  cursor.setDate(cursor.getDate() - 1) // start checking from yesterday
  while (days.has(dateKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export async function runMemberReminders() {
  const today = startOfDay(new Date())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  let classReminders = 0
  let courtReminders = 0
  let paymentReminders = 0
  let streakReminders = 0

  // Only consider members who actually have notifications enabled — no
  // point doing the query work for accounts with zero push subscriptions.
  const subscribedAccountIds = await prisma.memberPushSubscription
    .findMany({ select: { accountId: true }, distinct: ["accountId"] })
    .then((rows) => rows.map((r) => r.accountId))
  if (subscribedAccountIds.length === 0) {
    return { classReminders, courtReminders, paymentReminders, streakReminders }
  }

  const gymLinks = await prisma.memberGymLink.findMany({
    where: { accountId: { in: subscribedAccountIds }, status: "ACTIVE" },
    select: { accountId: true, memberId: true },
  })
  const accountIdByMemberId = new Map(gymLinks.map((l) => [l.memberId, l.accountId]))
  const memberIds = gymLinks.map((l) => l.memberId)
  if (memberIds.length === 0) {
    return { classReminders, courtReminders, paymentReminders, streakReminders }
  }

  // 1. Classes happening today
  const classesToday = await prisma.classBooking.findMany({
    where: { memberId: { in: memberIds }, classDate: { gte: today, lt: tomorrow }, status: "CONFIRMED" },
    include: { schedule: { select: { title: true, startTime: true } } },
  })
  for (const booking of classesToday) {
    const accountId = accountIdByMemberId.get(booking.memberId)
    if (!accountId) continue
    await sendPushToAccount(accountId, {
      title: "Class today",
      body: `${booking.schedule.title} at ${booking.schedule.startTime}`,
      url: "/portal/classes",
    })
    classReminders++
  }

  // 2. Court bookings happening today
  const courtsToday = await prisma.slotBooking.findMany({
    where: { memberId: { in: memberIds }, bookingDate: { gte: today, lt: tomorrow }, status: "CONFIRMED" },
    include: { court: { select: { name: true } } },
  })
  for (const booking of courtsToday) {
    const accountId = accountIdByMemberId.get(booking.memberId!)
    if (!accountId) continue
    await sendPushToAccount(accountId, {
      title: "Court booking today",
      body: `${booking.court.name} at ${booking.startTime}`,
      url: "/portal/courts",
    })
    courtReminders++
  }

  // 3. Payments due today or overdue
  const dueInvoices = await prisma.invoice.findMany({
    where: {
      memberId: { in: memberIds },
      paymentStatus: { in: ["PENDING", "PARTIAL"] },
      dueDate: { lt: tomorrow },
    },
    select: { memberId: true, total: true, paidAmount: true, dueDate: true },
  })
  // One notification per member, summing whatever's due (not one per invoice).
  const outstandingByMember = new Map<string, { amount: number; overdue: boolean }>()
  for (const inv of dueInvoices) {
    if (!inv.memberId) continue
    const outstanding = Number(inv.total) - Number(inv.paidAmount)
    if (outstanding <= 0) continue
    const existing = outstandingByMember.get(inv.memberId) ?? { amount: 0, overdue: false }
    existing.amount += outstanding
    if (inv.dueDate && inv.dueDate < today) existing.overdue = true
    outstandingByMember.set(inv.memberId, existing)
  }
  for (const [memberId, { amount, overdue }] of outstandingByMember) {
    const accountId = accountIdByMemberId.get(memberId)
    if (!accountId) continue
    await sendPushToAccount(accountId, {
      title: overdue ? "Payment overdue" : "Payment due today",
      body: `${fmt(amount)} ${overdue ? "is overdue" : "is due today"} — pay via KuickPay`,
      url: "/portal/invoices",
    })
    paymentReminders++
  }

  // 4. Attendance streak — nudge members with a 3+ day streak who haven't
  // checked in yet today, so they don't lose it.
  const recentAttendance = await prisma.attendance.findMany({
    where: { memberId: { in: memberIds }, checkedInAt: { gte: new Date(today.getTime() - 14 * 86400000) } },
    select: { memberId: true, checkedInAt: true },
  })
  const attendanceByMember = new Map<string, Date[]>()
  for (const a of recentAttendance) {
    const list = attendanceByMember.get(a.memberId) ?? []
    list.push(a.checkedInAt)
    attendanceByMember.set(a.memberId, list)
  }
  for (const [memberId, dates] of attendanceByMember) {
    const checkedInToday = dates.some((d) => d >= today && d < tomorrow)
    if (checkedInToday) continue
    const streak = currentStreak(dates)
    if (streak < STREAK_MIN_DAYS) continue
    const accountId = accountIdByMemberId.get(memberId)
    if (!accountId) continue
    await sendPushToAccount(accountId, {
      title: `${streak}-day streak!`,
      body: "Check in today to keep it going.",
      url: "/portal/checkin",
    })
    streakReminders++
  }

  return { classReminders, courtReminders, paymentReminders, streakReminders }
}
