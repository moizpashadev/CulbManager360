-- AlterEnum
ALTER TYPE "InvoiceType" ADD VALUE 'GUEST_FEE';

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "familyHeadId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "defaultGuestFee" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "Member_familyHeadId_idx" ON "Member"("familyHeadId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_familyHeadId_fkey" FOREIGN KEY ("familyHeadId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
