-- Phase 4: RentalApplication erweitert + eindeutige Kombination Listing/Bewerber

-- Duplikate entfernen (neueste Zeile pro Paar behalten)
DELETE FROM "rental_applications" a
WHERE a."id" NOT IN (
  SELECT "id" FROM (
    SELECT DISTINCT ON ("rentalListingId", "applicantUserId") "id"
    FROM "rental_applications"
    ORDER BY "rentalListingId", "applicantUserId", "createdAt" DESC, "id" DESC
  ) sub
);

ALTER TABLE "rental_applications" ALTER COLUMN "message" DROP NOT NULL;

ALTER TABLE "rental_applications"
ADD COLUMN "viewingRequestedAt" TIMESTAMP(3),
ADD COLUMN "viewingDate" TIMESTAMP(3),
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "rejectionNote" TEXT,
ADD COLUMN "tenantProfileId" TEXT;

CREATE UNIQUE INDEX "rental_applications_rentalListingId_applicantUserId_key"
ON "rental_applications"("rentalListingId", "applicantUserId");

CREATE INDEX "rental_applications_tenantProfileId_idx" ON "rental_applications"("tenantProfileId");

ALTER TABLE "rental_applications"
ADD CONSTRAINT "rental_applications_tenantProfileId_fkey"
FOREIGN KEY ("tenantProfileId") REFERENCES "tenant_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
