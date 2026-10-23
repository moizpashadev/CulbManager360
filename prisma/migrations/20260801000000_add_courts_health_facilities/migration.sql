-- CreateEnum
CREATE TYPE "PriceMode" AS ENUM ('MANUAL', 'FACILITY_BASED');

-- CreateEnum
CREATE TYPE "SlotBookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "HealthGoal" AS ENUM ('WEIGHT_LOSS', 'MUSCLE_GAIN', 'GENERAL_FITNESS', 'REHABILITATION', 'ENDURANCE', 'FLEXIBILITY');

-- AlterEnum
ALTER TYPE "InvoiceType" ADD VALUE 'COURT_BOOKING';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID', 'PARTIAL', 'WAIVED');
ALTER TABLE "public"."Invoice" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "Invoice" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_memberId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "kuickpayConsumerNo" TEXT,
ADD COLUMN     "slotBookingId" TEXT,
ALTER COLUMN "memberId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MembershipPlan" ADD COLUMN     "priceMode" "PriceMode" NOT NULL DEFAULT 'MANUAL';

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "moduleCourts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moduleGym" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "TenantFacility" ADD COLUMN     "monthlyFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "PlanFacility" (
    "planId" TEXT NOT NULL,
    "facilityId" TEXT NOT NULL,

    CONSTRAINT "PlanFacility_pkey" PRIMARY KEY ("planId","facilityId")
);

-- CreateTable
CREATE TABLE "Court" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sport" TEXT,
    "pricePerSlot" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "slotDuration" INTEGER NOT NULL DEFAULT 60,
    "openTime" TEXT NOT NULL DEFAULT '06:00',
    "closeTime" TEXT NOT NULL DEFAULT '22:00',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Court_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlotBooking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "memberId" TEXT,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationSlots" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod",
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "kuickpayConsumerNo" TEXT,
    "status" "SlotBookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlotBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberHealth" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "height" DOUBLE PRECISION,
    "initialWeight" DOUBLE PRECISION,
    "bloodGroup" TEXT,
    "medicalConditions" TEXT,
    "allergies" TEXT,
    "goal" "HealthGoal" NOT NULL DEFAULT 'GENERAL_FITNESS',
    "targetWeight" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressEntry" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trainerId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION,
    "chest" DOUBLE PRECISION,
    "waist" DOUBLE PRECISION,
    "hips" DOUBLE PRECISION,
    "bicep" DOUBLE PRECISION,
    "thigh" DOUBLE PRECISION,
    "shoulders" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressReport" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trainerId" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberHealth_memberId_key" ON "MemberHealth"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_slotBookingId_key" ON "Invoice"("slotBookingId");

-- AddForeignKey
ALTER TABLE "PlanFacility" ADD CONSTRAINT "PlanFacility_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MembershipPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFacility" ADD CONSTRAINT "PlanFacility_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "TenantFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_slotBookingId_fkey" FOREIGN KEY ("slotBookingId") REFERENCES "SlotBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Court" ADD CONSTRAINT "Court_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotBooking" ADD CONSTRAINT "SlotBooking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotBooking" ADD CONSTRAINT "SlotBooking_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "Court"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlotBooking" ADD CONSTRAINT "SlotBooking_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberHealth" ADD CONSTRAINT "MemberHealth_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressEntry" ADD CONSTRAINT "ProgressEntry_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressReport" ADD CONSTRAINT "ProgressReport_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
