-- AlterEnum
ALTER TYPE "DeactivationReason" ADD VALUE 'LISTING_EXPIRED';

-- AlterTable
ALTER TABLE "rental_listings" ADD COLUMN "listingExpiresOn" TEXT,
ADD COLUMN "needsExpiryReview" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "rental_listings_status_listingExpiresOn_idx" ON "rental_listings" ("status", "listingExpiresOn");
