-- CreateEnum
CREATE TYPE "MemberGymLinkStatus" AS ENUM ('ACTIVE', 'FROZEN', 'LEFT');

-- CreateTable
CREATE TABLE "MemberAccount" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "oauthGoogleId" TEXT,
    "oauthFbId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberOtp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberGymLink" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "status" "MemberGymLinkStatus" NOT NULL DEFAULT 'ACTIVE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberGymLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberAccount_email_key" ON "MemberAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MemberAccount_oauthGoogleId_key" ON "MemberAccount"("oauthGoogleId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberAccount_oauthFbId_key" ON "MemberAccount"("oauthFbId");

-- CreateIndex
CREATE INDEX "MemberAccount_oauthGoogleId_idx" ON "MemberAccount"("oauthGoogleId");

-- CreateIndex
CREATE INDEX "MemberAccount_oauthFbId_idx" ON "MemberAccount"("oauthFbId");

-- CreateIndex
CREATE INDEX "MemberOtp_email_idx" ON "MemberOtp"("email");

-- CreateIndex
CREATE INDEX "MemberGymLink_tenantId_idx" ON "MemberGymLink"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberGymLink_accountId_tenantId_memberId_key" ON "MemberGymLink"("accountId", "tenantId", "memberId");

-- AddForeignKey
ALTER TABLE "MemberGymLink" ADD CONSTRAINT "MemberGymLink_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MemberAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberGymLink" ADD CONSTRAINT "MemberGymLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberGymLink" ADD CONSTRAINT "MemberGymLink_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
