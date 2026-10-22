-- CreateTable
CREATE TABLE "MemberPushSubscription" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemberPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberPushSubscription_endpoint_key" ON "MemberPushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "MemberPushSubscription_accountId_idx" ON "MemberPushSubscription"("accountId");

-- AddForeignKey
ALTER TABLE "MemberPushSubscription" ADD CONSTRAINT "MemberPushSubscription_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MemberAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
