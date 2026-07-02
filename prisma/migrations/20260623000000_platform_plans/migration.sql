-- CreateEnum
CREATE TYPE "PlatformPlanType" AS ENUM ('OFFLINE', 'SELF_HOSTED', 'SAAS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PlatformPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PlatformPlanType" NOT NULL,
    "description" TEXT,
    "oneTimePrice" DECIMAL(10,2),
    "monthlyPrice" DECIMAL(10,2),
    "features" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PlatformPlan_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN "platformPlanId" TEXT,
ADD COLUMN "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN "subscriptionStart" TIMESTAMP(3),
ADD COLUMN "nextBillingDate" TIMESTAMP(3),
ADD COLUMN "subscriptionNotes" TEXT;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_platformPlanId_fkey"
FOREIGN KEY ("platformPlanId") REFERENCES "PlatformPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
