import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: "postgresql://postgres:password@localhost:5432/gymkhana?schema=public" })
const prisma = new PrismaClient({ adapter })

function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r
}
function subDays(d: Date, n: number) {
  return addDays(d, -n)
}

async function main() {
  const NOW = new Date("2026-06-18T10:00:00Z")

  console.log("🌱  Seeding Club Manager 360 …")

  // ── Super Admin ────────────────────────────────────────────────────────────
  const superHash = await bcrypt.hash("super123", 10)
  await prisma.superAdmin.upsert({
    where: { email: "super@clubmanager360.com" },
    update: {},
    create: { firstName: "Super", lastName: "Admin", email: "super@clubmanager360.com", passwordHash: superHash },
  })

  // ── Tenant ─────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { id: "demo-tenant" },
    update: {},
    create: {
      id: "demo-tenant",
      name: "FitZone Karachi",
      slug: "fitzone-karachi",
      contactEmail: "owner@fitzone.pk",
      phone: "021-35000000",
      address: "Karachi, Pakistan",
    },
  })

  // ── Branches ────────────────────────────────────────────────────────────────
  const branchMain = await prisma.branch.upsert({
    where: { id: "branch-main" },
    update: {},
    create: {
      id: "branch-main",
      tenantId: tenant.id,
      name: "Main Campus",
      address: "Plot 12, Block 5, Clifton, Karachi",
      phone: "021-35001111",
      email: "clifton@fitzone.pk",
    },
  })

  const branchDHA = await prisma.branch.upsert({
    where: { id: "branch-dha" },
    update: {},
    create: {
      id: "branch-dha",
      tenantId: tenant.id,
      name: "DHA Branch",
      address: "Phase 6, DHA, Karachi",
      phone: "021-35002222",
      email: "dha@fitzone.pk",
    },
  })

  const branchGulshan = await prisma.branch.upsert({
    where: { id: "branch-gulshan" },
    update: {},
    create: {
      id: "branch-gulshan",
      tenantId: tenant.id,
      name: "Gulshan Branch",
      address: "Block 3, Gulshan-e-Iqbal, Karachi",
      phone: "021-35003333",
      email: "gulshan@fitzone.pk",
    },
  })

  // ── Staff Accounts ─────────────────────────────────────────────────────────
  const h = (pw: string) => bcrypt.hash(pw, 10)

  // Owner
  const ownerHash = await h("admin123")
  await prisma.staff.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@fitzone.pk" } },
    update: {},
    create: {
      id: "staff-owner",
      tenantId: tenant.id,
      firstName: "Ahmed",
      lastName: "Khan",
      email: "admin@fitzone.pk",
      passwordHash: ownerHash,
      role: "OWNER",
    },
  })

  // Admin
  const adminHash = await h("admin456")
  await prisma.staff.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "sara@fitzone.pk" } },
    update: {},
    create: {
      id: "staff-admin",
      tenantId: tenant.id,
      firstName: "Sara",
      lastName: "Ahmed",
      email: "sara@fitzone.pk",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  })

  // Manager
  const managerHash = await h("manager123")
  await prisma.staff.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "usman@fitzone.pk" } },
    update: {},
    create: {
      id: "staff-manager",
      tenantId: tenant.id,
      firstName: "Usman",
      lastName: "Tariq",
      email: "usman@fitzone.pk",
      passwordHash: managerHash,
      role: "MANAGER",
    },
  })

  // Receptionist (STAFF role)
  const recHash = await h("staff123")
  await prisma.staff.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "maria@fitzone.pk" } },
    update: {},
    create: {
      id: "staff-rec",
      tenantId: tenant.id,
      firstName: "Maria",
      lastName: "Siddiqui",
      email: "maria@fitzone.pk",
      passwordHash: recHash,
      role: "STAFF",
    },
  })

  // ── Trainers ───────────────────────────────────────────────────────────────
  const t1Hash = await h("trainer123")
  const trainer1 = await prisma.staff.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "ali.trainer@fitzone.pk" } },
    update: {},
    create: {
      id: "trainer-ali",
      tenantId: tenant.id,
      firstName: "Ali",
      lastName: "Hassan",
      email: "ali.trainer@fitzone.pk",
      passwordHash: t1Hash,
      role: "TRAINER",
      employmentType: "SALARIED",
      salaryAmount: 55000,
      specialization: "Strength & Conditioning",
      bio: "7 years experience, certified NSCA strength coach. Focuses on powerlifting and functional fitness.",
    },
  })

  const t2Hash = await h("trainer123")
  const trainer2 = await prisma.staff.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "fatima.trainer@fitzone.pk" } },
    update: {},
    create: {
      id: "trainer-fatima",
      tenantId: tenant.id,
      firstName: "Fatima",
      lastName: "Noor",
      email: "fatima.trainer@fitzone.pk",
      passwordHash: t2Hash,
      role: "TRAINER",
      employmentType: "COMMISSION",
      commissionRate: 20,
      specialization: "Yoga & Pilates",
      bio: "Yoga Alliance certified. Specialises in flexibility, posture correction and mindfulness-based training.",
    },
  })

  const t3Hash = await h("trainer123")
  const trainer3 = await prisma.staff.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "zain.trainer@fitzone.pk" } },
    update: {},
    create: {
      id: "trainer-zain",
      tenantId: tenant.id,
      firstName: "Zain",
      lastName: "Mirza",
      email: "zain.trainer@fitzone.pk",
      passwordHash: t3Hash,
      role: "TRAINER",
      employmentType: "SELF_EMPLOYED",
      specialization: "CrossFit & HIIT",
      bio: "Level 2 CrossFit coach. Runs high-intensity group sessions 6 days a week.",
    },
  })

  // ── Branch assignments for trainers ───────────────────────────────────────
  await prisma.staffBranch.upsert({
    where: { staffId_branchId: { staffId: trainer1.id, branchId: branchMain.id } },
    update: {},
    create: { staffId: trainer1.id, branchId: branchMain.id, isPrimary: true },
  })
  await prisma.staffBranch.upsert({
    where: { staffId_branchId: { staffId: trainer1.id, branchId: branchDHA.id } },
    update: {},
    create: { staffId: trainer1.id, branchId: branchDHA.id, isPrimary: false },
  })
  await prisma.staffBranch.upsert({
    where: { staffId_branchId: { staffId: trainer2.id, branchId: branchMain.id } },
    update: {},
    create: { staffId: trainer2.id, branchId: branchMain.id, isPrimary: true },
  })
  await prisma.staffBranch.upsert({
    where: { staffId_branchId: { staffId: trainer2.id, branchId: branchGulshan.id } },
    update: {},
    create: { staffId: trainer2.id, branchId: branchGulshan.id, isPrimary: false },
  })
  await prisma.staffBranch.upsert({
    where: { staffId_branchId: { staffId: trainer3.id, branchId: branchDHA.id } },
    update: {},
    create: { staffId: trainer3.id, branchId: branchDHA.id, isPrimary: true },
  })

  // ── Trainer Slots ──────────────────────────────────────────────────────────
  // Ali — Mon/Wed/Fri at Main, Sat at DHA
  const slot1 = await upsertSlot("slot-ali-mwf-main", tenant.id, trainer1.id, branchMain.id, 0, "07:00", "08:00", 2) // Mon
  const slot2 = await upsertSlot("slot-ali-wed-main", tenant.id, trainer1.id, branchMain.id, 2, "07:00", "08:00", 2) // Wed
  const slot3 = await upsertSlot("slot-ali-fri-main", tenant.id, trainer1.id, branchMain.id, 4, "07:00", "08:00", 2) // Fri
  const slot4 = await upsertSlot("slot-ali-sat-dha",  tenant.id, trainer1.id, branchDHA.id,  5, "09:00", "10:00", 3) // Sat
  const slot5 = await upsertSlot("slot-ali-mwf-main-pm", tenant.id, trainer1.id, branchMain.id, 1, "18:00", "19:00", 1) // Tue PM

  // Fatima — Tue/Thu/Sat at Main, Sun at Gulshan
  const slot6 = await upsertSlot("slot-fatima-tue",  tenant.id, trainer2.id, branchMain.id,    1, "09:00", "10:00", 4) // Tue
  const slot7 = await upsertSlot("slot-fatima-thu",  tenant.id, trainer2.id, branchMain.id,    3, "09:00", "10:00", 4) // Thu
  const slot8 = await upsertSlot("slot-fatima-sat",  tenant.id, trainer2.id, branchMain.id,    5, "08:00", "09:00", 4) // Sat
  const slot9 = await upsertSlot("slot-fatima-sun",  tenant.id, trainer2.id, branchGulshan.id, 6, "10:00", "11:00", 3) // Sun

  // Zain — Mon–Fri evening at DHA
  const slot10 = await upsertSlot("slot-zain-mon", tenant.id, trainer3.id, branchDHA.id, 0, "17:00", "18:30", 8)
  const slot11 = await upsertSlot("slot-zain-wed", tenant.id, trainer3.id, branchDHA.id, 2, "17:00", "18:30", 8)
  const slot12 = await upsertSlot("slot-zain-fri", tenant.id, trainer3.id, branchDHA.id, 4, "17:00", "18:30", 8)

  // ── Membership Plans ───────────────────────────────────────────────────────
  const plan1 = await upsertPlan("plan-monthly",    tenant.id, "Monthly",          "",               3500,  30)
  const plan2 = await upsertPlan("plan-quarterly",  tenant.id, "Quarterly",        "Save 10%",       9500,  90)
  const plan3 = await upsertPlan("plan-biannual",   tenant.id, "6-Month",          "Best value",     17000, 180)
  const plan4 = await upsertPlan("plan-annual",     tenant.id, "Annual",           "Ultimate deal",  30000, 365)
  const plan5 = await upsertPlan("plan-premium-pt", tenant.id, "Premium + PT",     "Includes trainer",6500,  30)

  // ── Members ─────────────────────────────────────────────────────────────────
  const members = await Promise.all([
    upsertMember("mem-01", tenant.id, branchMain.id,    "Bilal",   "Raza",     "bilal.raza@gmail.com",      "0312-1111001", "42201-1111001-1", subDays(NOW, 180)),
    upsertMember("mem-02", tenant.id, branchMain.id,    "Hina",    "Malik",    "hina.malik@gmail.com",      "0312-1111002", "42201-1111002-2", subDays(NOW, 120)),
    upsertMember("mem-03", tenant.id, branchDHA.id,     "Omar",    "Farooq",   "omar.farooq@gmail.com",     "0312-1111003", "42201-1111003-3", subDays(NOW,  90)),
    upsertMember("mem-04", tenant.id, branchDHA.id,     "Ayesha",  "Baig",     "ayesha.baig@gmail.com",     "0312-1111004", "42201-1111004-4", subDays(NOW,  60)),
    upsertMember("mem-05", tenant.id, branchMain.id,    "Hamza",   "Sheikh",   "hamza.sheikh@gmail.com",    "0312-1111005", "42201-1111005-5", subDays(NOW,  30)),
    upsertMember("mem-06", tenant.id, branchGulshan.id, "Sana",    "Qureshi",  "sana.qureshi@gmail.com",    "0312-1111006", "42201-1111006-6", subDays(NOW,  45)),
    upsertMember("mem-07", tenant.id, branchDHA.id,     "Faisal",  "Javed",    "faisal.javed@gmail.com",    "0312-1111007", "42201-1111007-7", subDays(NOW,  20)),
    upsertMember("mem-08", tenant.id, branchMain.id,    "Zara",    "Khan",     "zara.khan@gmail.com",       "0312-1111008", "42201-1111008-8", subDays(NOW,  15)),
    upsertMember("mem-09", tenant.id, branchGulshan.id, "Imran",   "Ashraf",   "imran.ashraf@gmail.com",    "0312-1111009", "42201-1111009-9", subDays(NOW,  10)),
    upsertMember("mem-10", tenant.id, branchDHA.id,     "Nadia",   "Shah",     "nadia.shah@gmail.com",      "0312-1111010", "42201-1111010-1", subDays(NOW,   5)),
    upsertMember("mem-11", tenant.id, branchMain.id,    "Tariq",   "Hussain",  "tariq.hussain@gmail.com",   "0312-1111011", "42201-1111011-2", subDays(NOW, 200)),
    upsertMember("mem-12", tenant.id, branchMain.id,    "Amna",    "Rizvi",    "amna.rizvi@gmail.com",      "0312-1111012", "42201-1111012-3", subDays(NOW, 150)),
    upsertMember("mem-13", tenant.id, branchDHA.id,     "Kamran",  "Butt",     "kamran.butt@gmail.com",     "0312-1111013", "42201-1111013-4", subDays(NOW,  80)),
    upsertMember("mem-14", tenant.id, branchGulshan.id, "Rubab",   "Zaidi",    "rubab.zaidi@gmail.com",     "0312-1111014", "42201-1111014-5", subDays(NOW,  40)),
    upsertMember("mem-15", tenant.id, branchMain.id,    "Hassan",  "Mirza",    "hassan.mirza@gmail.com",    "0312-1111015", "42201-1111015-6", subDays(NOW,   2)),
  ])

  const [m1,m2,m3,m4,m5,m6,m7,m8,m9,m10,m11,m12,m13,m14,m15] = members

  // ── Memberships + Invoices ─────────────────────────────────────────────────
  // Active memberships
  await assignMembership("ms-01",  tenant.id, m1.id,  plan3.id, branchMain.id,    subDays(NOW,180), addDays(subDays(NOW,180), 180), 0,    "PAID", "CASH",          NOW)
  await assignMembership("ms-02",  tenant.id, m2.id,  plan2.id, branchMain.id,    subDays(NOW,120), addDays(subDays(NOW,120),  90), 0,    "PAID", "EASYPAISA",     NOW)
  await assignMembership("ms-03",  tenant.id, m3.id,  plan5.id, branchDHA.id,     subDays(NOW, 90), addDays(subDays(NOW, 90),  30), 500,  "PAID", "BANK_TRANSFER", NOW)
  await assignMembership("ms-04",  tenant.id, m4.id,  plan1.id, branchDHA.id,     subDays(NOW, 60), addDays(subDays(NOW, 60),  30), 0,    "PAID", "CASH",          NOW)
  await assignMembership("ms-05",  tenant.id, m5.id,  plan4.id, branchMain.id,    subDays(NOW, 30), addDays(subDays(NOW, 30), 365), 2000, "PAID", "JAZZCASH",      NOW)
  await assignMembership("ms-06",  tenant.id, m6.id,  plan2.id, branchGulshan.id, subDays(NOW, 45), addDays(subDays(NOW, 45),  90), 0,    "PAID", "CASH",          NOW)
  await assignMembership("ms-07",  tenant.id, m7.id,  plan1.id, branchDHA.id,     subDays(NOW, 20), addDays(subDays(NOW, 20),  30), 0,    "PAID", "CARD",          NOW)
  await assignMembership("ms-08",  tenant.id, m8.id,  plan5.id, branchMain.id,    subDays(NOW, 15), addDays(subDays(NOW, 15),  30), 0,    "PENDING", null,          NOW)
  await assignMembership("ms-09",  tenant.id, m9.id,  plan3.id, branchGulshan.id, subDays(NOW, 10), addDays(subDays(NOW, 10), 180), 0,    "PAID", "CHEQUE",        NOW)
  await assignMembership("ms-10",  tenant.id, m10.id, plan1.id, branchDHA.id,     subDays(NOW,  5), addDays(subDays(NOW,  5),  30), 0,    "PENDING", null,          NOW)
  // Expired memberships (for members 11+)
  await assignMembership("ms-11",  tenant.id, m11.id, plan1.id, branchMain.id,    subDays(NOW,170), subDays(NOW,140), 0, "PAID", "CASH", NOW, "EXPIRED")
  await assignMembership("ms-12",  tenant.id, m12.id, plan2.id, branchMain.id,    subDays(NOW,150), subDays(NOW, 60), 0, "PAID", "CASH", NOW, "EXPIRED")
  await assignMembership("ms-13",  tenant.id, m13.id, plan1.id, branchDHA.id,     subDays(NOW, 80), subDays(NOW, 50), 0, "PAID", "EASYPAISA", NOW, "EXPIRED")
  // Pending/new members
  await assignMembership("ms-14",  tenant.id, m14.id, plan2.id, branchGulshan.id, subDays(NOW, 40), addDays(subDays(NOW,40), 90), 0, "PAID", "CASH", NOW)
  await assignMembership("ms-15",  tenant.id, m15.id, plan1.id, branchMain.id,    subDays(NOW,  2), addDays(subDays(NOW, 2), 30), 0, "PENDING", null, NOW)

  // Registration fees for some members
  await upsertInvoice("inv-reg-01", tenant.id, m1.id, null, branchMain.id, "REGISTRATION", "One-time registration fee", 1000, 0, "PAID", "CASH", subDays(NOW,180))
  await upsertInvoice("inv-reg-02", tenant.id, m3.id, null, branchDHA.id,  "REGISTRATION", "One-time registration fee", 1000, 0, "PAID", "CASH", subDays(NOW, 90))
  await upsertInvoice("inv-reg-03", tenant.id, m5.id, null, branchMain.id, "REGISTRATION", "One-time registration fee", 1000, 0, "PAID", "JAZZCASH", subDays(NOW, 30))
  await upsertInvoice("inv-reg-04", tenant.id, m15.id, null, branchMain.id,"REGISTRATION", "One-time registration fee", 500, 0,  "PENDING", null, subDays(NOW, 2))

  // ── Trainer Member Assignments ─────────────────────────────────────────────
  // Ali — strength members
  await upsertAssignment("asn-01", tenant.id, trainer1.id, m1.id,  branchMain.id, slot1.id, subDays(NOW,180))
  await upsertAssignment("asn-02", tenant.id, trainer1.id, m5.id,  branchMain.id, slot2.id, subDays(NOW, 30))
  await upsertAssignment("asn-03", tenant.id, trainer1.id, m8.id,  branchMain.id, slot3.id, subDays(NOW, 15))
  await upsertAssignment("asn-04", tenant.id, trainer1.id, m3.id,  branchDHA.id,  slot4.id, subDays(NOW, 90))

  // Fatima — yoga/pilates
  await upsertAssignment("asn-05", tenant.id, trainer2.id, m2.id,  branchMain.id, slot6.id, subDays(NOW,120))
  await upsertAssignment("asn-06", tenant.id, trainer2.id, m6.id,  branchGulshan.id, slot9.id, subDays(NOW, 45))
  await upsertAssignment("asn-07", tenant.id, trainer2.id, m12.id, branchMain.id, slot7.id, subDays(NOW,150))

  // Zain — CrossFit
  await upsertAssignment("asn-08", tenant.id, trainer3.id, m4.id,  branchDHA.id, slot10.id, subDays(NOW, 60))
  await upsertAssignment("asn-09", tenant.id, trainer3.id, m7.id,  branchDHA.id, slot11.id, subDays(NOW, 20))
  await upsertAssignment("asn-10", tenant.id, trainer3.id, m10.id, branchDHA.id, slot12.id, subDays(NOW,  5))

  // ── Trainer Attendance ─────────────────────────────────────────────────────
  for (let i = 7; i >= 1; i--) {
    const d = subDays(NOW, i)
    if (d.getDay() !== 0 && d.getDay() !== 6) { // weekdays
      const inT = new Date(d); inT.setHours(6, 45, 0, 0)
      const outT = new Date(d); outT.setHours(11, 30, 0, 0)
      await prisma.trainerAttendance.create({
        data: { tenantId: tenant.id, trainerId: trainer1.id, branchId: branchMain.id, checkedInAt: inT, checkedOutAt: outT },
      }).catch(() => {})
    }
    if (d.getDay() !== 0) {
      const inT = new Date(d); inT.setHours(8, 50, 0, 0)
      const outT = new Date(d); outT.setHours(13, 0, 0, 0)
      await prisma.trainerAttendance.create({
        data: { tenantId: tenant.id, trainerId: trainer2.id, branchId: branchMain.id, checkedInAt: inT, checkedOutAt: outT },
      }).catch(() => {})
    }
  }
  // Trainer 1 checked in today (no checkout yet)
  const todayIn = new Date(NOW); todayIn.setHours(7, 0, 0, 0)
  await prisma.trainerAttendance.create({
    data: { tenantId: tenant.id, trainerId: trainer1.id, branchId: branchMain.id, checkedInAt: todayIn },
  }).catch(() => {})

  // ── Member Attendance (4 months) ─────────────────────────────────────────
  // Clear existing attendance so re-runs don't double-create
  await prisma.attendance.deleteMany({ where: { tenantId: tenant.id } })

  // Members who attend regularly vs occasionally
  const regularMemIds   = [m1.id, m2.id, m3.id, m4.id, m5.id, m6.id]  // ~85% days
  const occasionalMemIds= [m7.id, m8.id, m9.id, m10.id, m11.id, m12.id, m13.id, m14.id] // ~40% days
  const branches = [branchMain.id, branchDHA.id, branchGulshan.id]

  const TOTAL_DAYS = 120 // 4 months back
  for (let daysAgo = TOTAL_DAYS; daysAgo >= 0; daysAgo--) {
    const day = subDays(NOW, daysAgo)
    const dow = day.getDay() // 0=Sun,6=Sat
    if (dow === 0) continue  // gym closed Sundays

    // Weekdays busier than Saturdays; slight growth trend toward recent weeks
    const isSat = dow === 6
    const growthFactor = 1 + ((TOTAL_DAYS - daysAgo) / TOTAL_DAYS) * 0.4 // 0% → +40%
    const branchIndex = Math.floor(daysAgo / 3) % 3

    // Regulars — each has their own chance based on day
    for (const memId of regularMemIds) {
      const threshold = isSat ? 0.55 : 0.82
      if (Math.random() > threshold * growthFactor) continue
      const branch = branches[branchIndex]
      const hour = isSat ? 9 + Math.floor(Math.random() * 3) : 6 + Math.floor(Math.random() * 5)
      const inT  = new Date(day); inT.setHours(hour, Math.floor(Math.random() * 60), 0, 0)
      const outT = new Date(inT); outT.setHours(inT.getHours() + 1 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0)
      await prisma.attendance.create({
        data: { tenantId: tenant.id, memberId: memId, branchId: branch, checkedInAt: inT, checkedOutAt: daysAgo > 0 ? outT : null },
      })
    }

    // Occasionals
    for (const memId of occasionalMemIds) {
      const threshold = isSat ? 0.2 : 0.35
      if (Math.random() > threshold * growthFactor) continue
      const branch = branches[(branchIndex + 1) % 3]
      const hour = 7 + Math.floor(Math.random() * 6)
      const inT  = new Date(day); inT.setHours(hour, Math.floor(Math.random() * 60), 0, 0)
      const outT = new Date(inT); outT.setHours(inT.getHours() + 1, 0, 0, 0)
      await prisma.attendance.create({
        data: { tenantId: tenant.id, memberId: memId, branchId: branch, checkedInAt: inT, checkedOutAt: daysAgo > 0 ? outT : null },
      })
    }
  }

  console.log("")
  console.log("✅  Seed complete — FitZone Karachi")
  console.log("")
  console.log("  ── Login Accounts ──────────────────────────────────────")
  console.log("  SUPER ADMIN   super@clubmanager360.com        super123")
  console.log("  OWNER         admin@fitzone.pk           admin123")
  console.log("  ADMIN         sara@fitzone.pk            admin456")
  console.log("  MANAGER       usman@fitzone.pk           manager123")
  console.log("  STAFF         maria@fitzone.pk           staff123")
  console.log("  TRAINER 1     ali.trainer@fitzone.pk     trainer123")
  console.log("  TRAINER 2     fatima.trainer@fitzone.pk  trainer123")
  console.log("  TRAINER 3     zain.trainer@fitzone.pk    trainer123")
  console.log("")
  console.log("  ── Branches ────────────────────────────────────────────")
  console.log("  Main Campus · DHA Branch · Gulshan Branch")
  console.log("")
  console.log("  ── Data ────────────────────────────────────────────────")
  console.log("  15 members · 5 plans · 15 memberships · 3 trainers")
  console.log("  12 trainer slots · 10 member–trainer assignments")
  console.log("  ~4 months of attendance records (120 days)")
  console.log("")
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function upsertSlot(id: string, tenantId: string, trainerId: string, branchId: string, dayOfWeek: number, startTime: string, endTime: string, capacity: number) {
  return prisma.trainerSlot.upsert({
    where: { id },
    update: {},
    create: { id, tenantId, trainerId, branchId, dayOfWeek, startTime, endTime, capacity },
  })
}

async function upsertPlan(id: string, tenantId: string, name: string, description: string, price: number, durationDays: number) {
  return prisma.membershipPlan.upsert({
    where: { id },
    update: {},
    create: { id, tenantId, name, description: description || null, price, durationDays },
  })
}

async function upsertMember(id: string, tenantId: string, branchId: string, firstName: string, lastName: string, email: string, phone: string, cnic: string, joinDate: Date) {
  const seq = parseInt(id.replace("mem-", ""), 10)
  const consumerNumber = String(seq).padStart(7, "0")
  return prisma.member.upsert({
    where: { id },
    update: { consumerNumber },
    create: { id, tenantId, branchId, firstName, lastName, email, phone, cnic, joinDate, consumerNumber, emergencyContact: `${firstName.split("")[0]} Family`, emergencyPhone: "0300-9999999" },
  })
}

async function assignMembership(
  id: string, tenantId: string, memberId: string, planId: string, branchId: string,
  startDate: Date, endDate: Date, discount: number,
  paymentStatus: "PAID" | "PENDING", paymentMethod: string | null, createdAt: Date,
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" = "ACTIVE"
) {
  const plan = await prisma.membershipPlan.findUnique({ where: { id: planId } })
  if (!plan) return
  const subtotal = Number(plan.price)
  const finalPrice = Math.max(0, subtotal - discount)

  const membership = await prisma.membership.upsert({
    where: { id },
    update: {},
    create: {
      id, memberId, planId, branchId, startDate, endDate, status,
      discount, finalPrice, createdAt,
    },
  })

  const invId = `inv-ms-${id}`
  await prisma.invoice.upsert({
    where: { id: invId },
    update: {},
    create: {
      id: invId, tenantId, memberId, membershipId: membership.id, branchId,
      type: "MEMBERSHIP",
      description: `${plan.name} — ${plan.durationDays} days`,
      subtotal, discount, total: finalPrice,
      paidAmount: paymentStatus === "PAID" ? finalPrice : 0,
      paymentStatus, paymentMethod: (paymentMethod as never) ?? null,
      paidAt: paymentStatus === "PAID" ? createdAt : null,
      createdAt,
    },
  })

  return membership
}

async function upsertInvoice(id: string, tenantId: string, memberId: string, membershipId: string | null, branchId: string, type: "REGISTRATION" | "MEMBERSHIP", description: string, subtotal: number, discount: number, paymentStatus: "PAID" | "PENDING", paymentMethod: string | null, createdAt: Date) {
  const total = subtotal - discount
  return prisma.invoice.upsert({
    where: { id },
    update: {},
    create: {
      id, tenantId, memberId, membershipId, branchId,
      type, description, subtotal, discount, total,
      paidAmount: paymentStatus === "PAID" ? total : 0,
      paymentStatus, paymentMethod: (paymentMethod as never) ?? null,
      paidAt: paymentStatus === "PAID" ? createdAt : null,
      createdAt,
    },
  })
}

async function upsertAssignment(id: string, tenantId: string, trainerId: string, memberId: string, branchId: string, slotId: string, startDate: Date) {
  return prisma.trainerMemberAssignment.upsert({
    where: { id },
    update: {},
    create: { id, tenantId, trainerId, memberId, branchId, slotId, startDate, status: "ACTIVE" },
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
