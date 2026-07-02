-- CreateEnum
CREATE TYPE "FacilityType" AS ENUM (
  'SWIMMING_POOL',
  'SAUNA',
  'STEAM_ROOM',
  'JACUZZI',
  'SQUASH_COURT',
  'BADMINTON_COURT',
  'BASKETBALL_COURT',
  'BOXING_RING',
  'YOGA_STUDIO',
  'CYCLING_STUDIO',
  'CROSSFIT_AREA',
  'CARDIO_ZONE',
  'FREE_WEIGHTS',
  'LOCKER_ROOMS',
  'PARKING',
  'JUICE_BAR',
  'MASSAGE_THERAPY',
  'PHYSICAL_THERAPY',
  'CHILDCARE',
  'MEDITATION_ROOM'
);

-- CreateTable
CREATE TABLE "TenantFacility" (
    "id"           TEXT NOT NULL,
    "tenantId"     TEXT NOT NULL,
    "facilityType" "FacilityType" NOT NULL,
    "isEnabled"    BOOLEAN NOT NULL DEFAULT true,
    "notes"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantFacility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantFacility_tenantId_facilityType_key" ON "TenantFacility"("tenantId", "facilityType");

-- AddForeignKey
ALTER TABLE "TenantFacility" ADD CONSTRAINT "TenantFacility_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
