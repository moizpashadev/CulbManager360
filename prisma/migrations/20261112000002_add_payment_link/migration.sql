-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "paymentLinkEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentLinkTemplate" TEXT;
