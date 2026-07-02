/*
  Warnings:

  - You are about to drop the column `clerkUserId` on the `Staff` table. All the data in the column will be lost.
  - You are about to drop the column `clerkOrgId` on the `Tenant` table. All the data in the column will be lost.
  - Added the required column `passwordHash` to the `Staff` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Staff_clerkUserId_key";

-- DropIndex
DROP INDEX "Tenant_clerkOrgId_key";

-- AlterTable
ALTER TABLE "Staff" DROP COLUMN "clerkUserId",
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "clerkOrgId";
