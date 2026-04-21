-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('SELF', 'IMPORTED', 'PARTNER');

-- AlterTable
ALTER TABLE "rental_listings" ADD COLUMN "importedFrom" TEXT,
ADD COLUMN "importSource" "ImportSource" NOT NULL DEFAULT 'SELF',
ADD COLUMN "landlordContact" TEXT;

-- CreateIndex
CREATE INDEX "rental_listings_importSource_idx" ON "rental_listings"("importSource");
