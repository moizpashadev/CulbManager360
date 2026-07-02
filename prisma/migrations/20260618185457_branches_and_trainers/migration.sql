-- Create EmploymentType enum
DO $$ BEGIN
  CREATE TYPE "EmploymentType" AS ENUM ('SALARIED', 'COMMISSION', 'SELF_EMPLOYED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create AssignmentStatus enum
DO $$ BEGIN
  CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create Branch table
CREATE TABLE IF NOT EXISTS "Branch" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "address"   TEXT,
  "phone"     TEXT,
  "email"     TEXT,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Branch"
  ADD CONSTRAINT "Branch_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create StaffBranch junction table
CREATE TABLE IF NOT EXISTS "StaffBranch" (
  "staffId"   TEXT NOT NULL,
  "branchId"  TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "StaffBranch_pkey" PRIMARY KEY ("staffId", "branchId")
);

ALTER TABLE "StaffBranch"
  ADD CONSTRAINT "StaffBranch_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StaffBranch"
  ADD CONSTRAINT "StaffBranch_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create TrainerSlot table
CREATE TABLE IF NOT EXISTS "TrainerSlot" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "trainerId" TEXT NOT NULL,
  "branchId"  TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime"   TEXT NOT NULL,
  "capacity"  INTEGER NOT NULL DEFAULT 1,
  "isActive"  BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "TrainerSlot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TrainerSlot"
  ADD CONSTRAINT "TrainerSlot_trainerId_fkey"
    FOREIGN KEY ("trainerId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainerSlot"
  ADD CONSTRAINT "TrainerSlot_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create TrainerMemberAssignment table
CREATE TABLE IF NOT EXISTS "TrainerMemberAssignment" (
  "id"        TEXT NOT NULL,
  "tenantId"  TEXT NOT NULL,
  "trainerId" TEXT NOT NULL,
  "memberId"  TEXT NOT NULL,
  "branchId"  TEXT NOT NULL,
  "slotId"    TEXT,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate"   TIMESTAMP(3),
  "status"    "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrainerMemberAssignment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TrainerMemberAssignment"
  ADD CONSTRAINT "TrainerMemberAssignment_trainerId_fkey"
    FOREIGN KEY ("trainerId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainerMemberAssignment"
  ADD CONSTRAINT "TrainerMemberAssignment_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainerMemberAssignment"
  ADD CONSTRAINT "TrainerMemberAssignment_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainerMemberAssignment"
  ADD CONSTRAINT "TrainerMemberAssignment_slotId_fkey"
    FOREIGN KEY ("slotId") REFERENCES "TrainerSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create TrainerAttendance table
CREATE TABLE IF NOT EXISTS "TrainerAttendance" (
  "id"           TEXT NOT NULL,
  "tenantId"     TEXT NOT NULL,
  "trainerId"    TEXT NOT NULL,
  "branchId"     TEXT NOT NULL,
  "checkedInAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checkedOutAt" TIMESTAMP(3),
  "notes"        TEXT,
  CONSTRAINT "TrainerAttendance_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TrainerAttendance"
  ADD CONSTRAINT "TrainerAttendance_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainerAttendance"
  ADD CONSTRAINT "TrainerAttendance_trainerId_fkey"
    FOREIGN KEY ("trainerId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrainerAttendance"
  ADD CONSTRAINT "TrainerAttendance_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add trainer fields to Staff
ALTER TABLE "Staff"
  ADD COLUMN IF NOT EXISTS "employmentType" "EmploymentType",
  ADD COLUMN IF NOT EXISTS "salaryAmount"   DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS "commissionRate" DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS "specialization" TEXT,
  ADD COLUMN IF NOT EXISTS "bio"            TEXT;

-- Add branchId to Member (nullable)
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Member"
  ADD CONSTRAINT "Member_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add branchId to Attendance (nullable)
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Attendance"
  ADD CONSTRAINT "Attendance_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add branchId to Membership (nullable)
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Membership"
  ADD CONSTRAINT "Membership_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add branchId to Invoice (nullable)
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "branchId" TEXT;
ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
