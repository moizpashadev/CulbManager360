-- CreateEnum
CREATE TYPE "PlatformBillingMode" AS ENUM ('FLAT', 'PER_MEMBER');

-- AlterTable
ALTER TABLE "PlatformPlan" ADD COLUMN     "billingMode" "PlatformBillingMode" NOT NULL DEFAULT 'FLAT',
ADD COLUMN     "pricePerMember" DECIMAL(10,2);
