-- CreateEnum
CREATE TYPE "MemberJoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "MemberAccount" ADD COLUMN     "referredByAccountId" TEXT;

-- CreateTable
CREATE TABLE "MemberJoinRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "status" "MemberJoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "MemberJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberJoinRequest_tenantId_status_idx" ON "MemberJoinRequest"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MemberJoinRequest_accountId_tenantId_key" ON "MemberJoinRequest"("accountId", "tenantId");

-- CreateIndex
CREATE INDEX "MemberAccount_referredByAccountId_idx" ON "MemberAccount"("referredByAccountId");

-- AddForeignKey
ALTER TABLE "MemberAccount" ADD CONSTRAINT "MemberAccount_referredByAccountId_fkey" FOREIGN KEY ("referredByAccountId") REFERENCES "MemberAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberJoinRequest" ADD CONSTRAINT "MemberJoinRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MemberAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberJoinRequest" ADD CONSTRAINT "MemberJoinRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
