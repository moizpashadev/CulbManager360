-- Add kuickpayInstitutionId to Tenant (each gym's Kuickpay biller code)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "kuickpayInstitutionId" TEXT;

-- Add consumerNumber to Member (unique auto-assigned per tenant for Kuickpay lookups)
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "consumerNumber" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Member_tenantId_consumerNumber_key"
  ON "Member"("tenantId", "consumerNumber");

-- Add Kuickpay tracking fields to Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "kuickpayTranAuthId"    TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "kuickpayBankMnemonic"  TEXT;

-- Add KUICKPAY to PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'KUICKPAY';
