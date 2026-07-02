-- Add fields to Member
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "cnic" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "emergencyContact" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "emergencyPhone" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "medicalNotes" TEXT;

-- Add notes to Attendance
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Add discount and notes to Membership
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "discount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Add finalPrice to Membership (backfill from plan price, then enforce NOT NULL)
ALTER TABLE "Membership" ADD COLUMN IF NOT EXISTS "finalPrice" DECIMAL(10,2);
UPDATE "Membership" m SET "finalPrice" = (SELECT p.price FROM "MembershipPlan" p WHERE p.id = m."planId");
ALTER TABLE "Membership" ALTER COLUMN "finalPrice" SET NOT NULL;

-- Drop old paymentStatus from Membership (moving payment tracking to Invoice)
ALTER TABLE "Membership" DROP COLUMN IF EXISTS "paymentStatus";

-- Extend PaymentStatus enum with new values
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PARTIAL';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'WAIVED';

-- Create InvoiceType enum
DO $$ BEGIN
  CREATE TYPE "InvoiceType" AS ENUM ('REGISTRATION', 'MEMBERSHIP', 'RENEWAL', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create PaymentMethod enum
DO $$ BEGIN
  CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'CARD', 'CHEQUE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create Invoice table
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id"            TEXT NOT NULL,
  "tenantId"      TEXT NOT NULL,
  "memberId"      TEXT NOT NULL,
  "membershipId"  TEXT,
  "type"          "InvoiceType" NOT NULL,
  "description"   TEXT,
  "subtotal"      DECIMAL(10,2) NOT NULL,
  "discount"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total"         DECIMAL(10,2) NOT NULL,
  "paidAmount"    DECIMAL(10,2) NOT NULL DEFAULT 0,
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paymentMethod" "PaymentMethod",
  "paidAt"        TIMESTAMP(3),
  "dueDate"       TIMESTAMP(3),
  "notes"         TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- Foreign keys for Invoice
ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_membershipId_fkey"
    FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;
