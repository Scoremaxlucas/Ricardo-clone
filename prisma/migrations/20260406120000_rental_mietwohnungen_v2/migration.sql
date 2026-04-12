-- Mietwohnungen v2: neue Tabellenstruktur (ersetzt rental_contact_requests + alte rental_listings-Spalten)
-- Bei bestehenden Daten: alte Miet-Inserate gehen verloren. Für Produktion ggf. Daten manuell migrieren.

DROP TABLE IF EXISTS "rental_applications" CASCADE;
DROP TABLE IF EXISTS "rental_contact_requests" CASCADE;
DROP TABLE IF EXISTS "rental_listings" CASCADE;

DROP TYPE IF EXISTS "RentalApplicationStatus" CASCADE;
DROP TYPE IF EXISTS "RentalListingStatus" CASCADE;

CREATE TYPE "RentalListingStatus" AS ENUM ('active', 'rented', 'archived');

CREATE TYPE "RentalApplicationStatus" AS ENUM (
  'pending_credit_check',
  'pending_manual_review',
  'approved',
  'rejected'
);

CREATE TABLE "rental_listings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "canton" TEXT NOT NULL,
    "rooms" DOUBLE PRECISION NOT NULL,
    "areaSqm" INTEGER NOT NULL,
    "floor" INTEGER,
    "rentPerMonth" INTEGER NOT NULL,
    "utilitiesPerMonth" INTEGER,
    "depositAmount" INTEGER,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "photos" TEXT NOT NULL,
    "requiresCreditCheck" BOOLEAN NOT NULL DEFAULT true,
    "status" "RentalListingStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "rental_listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rental_applications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rentalListingId" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "RentalApplicationStatus" NOT NULL,
    "encryptedFileRef" TEXT,
    "creditCheckResult" JSONB,

    CONSTRAINT "rental_applications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rental_listings_userId_idx" ON "rental_listings"("userId");
CREATE INDEX "rental_listings_canton_status_idx" ON "rental_listings"("canton", "status");
CREATE INDEX "rental_listings_rentPerMonth_idx" ON "rental_listings"("rentPerMonth");
CREATE INDEX "rental_listings_availableFrom_idx" ON "rental_listings"("availableFrom");

CREATE INDEX "rental_applications_rentalListingId_idx" ON "rental_applications"("rentalListingId");
CREATE INDEX "rental_applications_applicantUserId_idx" ON "rental_applications"("applicantUserId");
CREATE INDEX "rental_applications_status_idx" ON "rental_applications"("status");

ALTER TABLE "rental_listings"
ADD CONSTRAINT "rental_listings_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rental_applications"
ADD CONSTRAINT "rental_applications_rentalListingId_fkey"
FOREIGN KEY ("rentalListingId") REFERENCES "rental_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rental_applications"
ADD CONSTRAINT "rental_applications_applicantUserId_fkey"
FOREIGN KEY ("applicantUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
