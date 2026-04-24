-- CreateEnum
CREATE TYPE "RentalListingIngestDraftStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISCARDED');

-- CreateTable
CREATE TABLE "rental_listing_ingest_drafts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "status" "RentalListingIngestDraftStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "draftPayload" JSONB,
    "resolvedListingId" TEXT,

    CONSTRAINT "rental_listing_ingest_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_listing_ingest_drafts_createdByUserId_idx" ON "rental_listing_ingest_drafts"("createdByUserId");

-- CreateIndex
CREATE INDEX "rental_listing_ingest_drafts_status_idx" ON "rental_listing_ingest_drafts"("status");

-- AddForeignKey
ALTER TABLE "rental_listing_ingest_drafts" ADD CONSTRAINT "rental_listing_ingest_drafts_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
