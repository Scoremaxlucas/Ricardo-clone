-- CreateEnum
CREATE TYPE "WohnenCommissionStatus" AS ENUM ('pending', 'invoiced', 'paid', 'waived', 'cancelled');

-- CreateEnum
CREATE TYPE "WohnenTenantBonusStatus" AS ENUM ('not_eligible', 'eligible', 'pending_payout', 'paid', 'excluded');

-- AlterTable
ALTER TABLE "tenant_profiles" ADD COLUMN "bonusPayoutIban" TEXT,
ADD COLUMN "listingMatchAlertsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "wohnen_rental_placements" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rentalApplicationId" TEXT NOT NULL,
    "rentalListingId" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "netRentPerMonth" INTEGER NOT NULL,
    "commissionPercent" INTEGER NOT NULL DEFAULT 33,
    "commissionAmountChf" INTEGER NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0.081,
    "vatAmountChf" INTEGER NOT NULL,
    "commissionTotalChf" INTEGER NOT NULL,
    "commissionStatus" "WohnenCommissionStatus" NOT NULL DEFAULT 'pending',
    "moveInDate" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "commissionInvoicedAt" TIMESTAMP(3),
    "commissionPaidAt" TIMESTAMP(3),
    "tenantBonusAmountChf" INTEGER NOT NULL DEFAULT 250,
    "tenantBonusStatus" "WohnenTenantBonusStatus" NOT NULL DEFAULT 'eligible',
    "tenantBonusEligibleAt" TIMESTAMP(3),
    "tenantBonusPaidAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "recordedByUserId" TEXT,

    CONSTRAINT "wohnen_rental_placements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wohnen_listing_match_alerts" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantProfileId" TEXT NOT NULL,
    "rentalListingId" TEXT NOT NULL,

    CONSTRAINT "wohnen_listing_match_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wohnen_rental_placements_rentalApplicationId_key" ON "wohnen_rental_placements"("rentalApplicationId");

-- CreateIndex
CREATE INDEX "wohnen_rental_placements_rentalListingId_idx" ON "wohnen_rental_placements"("rentalListingId");

-- CreateIndex
CREATE INDEX "wohnen_rental_placements_applicantUserId_idx" ON "wohnen_rental_placements"("applicantUserId");

-- CreateIndex
CREATE INDEX "wohnen_rental_placements_commissionStatus_idx" ON "wohnen_rental_placements"("commissionStatus");

-- CreateIndex
CREATE INDEX "wohnen_rental_placements_tenantBonusStatus_idx" ON "wohnen_rental_placements"("tenantBonusStatus");

-- CreateIndex
CREATE UNIQUE INDEX "wohnen_listing_match_alerts_tenantProfileId_rentalListingId_key" ON "wohnen_listing_match_alerts"("tenantProfileId", "rentalListingId");

-- CreateIndex
CREATE INDEX "wohnen_listing_match_alerts_rentalListingId_idx" ON "wohnen_listing_match_alerts"("rentalListingId");

-- AddForeignKey
ALTER TABLE "wohnen_rental_placements" ADD CONSTRAINT "wohnen_rental_placements_rentalApplicationId_fkey" FOREIGN KEY ("rentalApplicationId") REFERENCES "rental_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wohnen_rental_placements" ADD CONSTRAINT "wohnen_rental_placements_rentalListingId_fkey" FOREIGN KEY ("rentalListingId") REFERENCES "rental_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wohnen_rental_placements" ADD CONSTRAINT "wohnen_rental_placements_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wohnen_rental_placements" ADD CONSTRAINT "wohnen_rental_placements_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wohnen_listing_match_alerts" ADD CONSTRAINT "wohnen_listing_match_alerts_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "tenant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wohnen_listing_match_alerts" ADD CONSTRAINT "wohnen_listing_match_alerts_rentalListingId_fkey" FOREIGN KEY ("rentalListingId") REFERENCES "rental_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
