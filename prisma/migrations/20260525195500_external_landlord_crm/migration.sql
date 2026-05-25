-- CreateEnum
CREATE TYPE "ExternalLandlordKind" AS ENUM ('private', 'agency', 'unknown');

-- CreateEnum
CREATE TYPE "ExternalLandlordContactKind" AS ENUM ('email', 'phone', 'whatsapp', 'other');

-- CreateEnum
CREATE TYPE "ExternalLandlordPermissionKind" AS ENUM ('listing_publication', 'photo_use', 'text_use', 'other');

-- CreateEnum
CREATE TYPE "ExternalLandlordEvidenceSource" AS ENUM ('email', 'whatsapp', 'phone', 'sms', 'form', 'manual', 'import_url', 'other');

-- CreateTable
CREATE TABLE "external_landlords" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT,
    "kind" "ExternalLandlordKind" NOT NULL DEFAULT 'unknown',
    "normalizedPrimaryEmail" TEXT,
    "normalizedPrimaryPhone" TEXT,
    "internalNotes" TEXT,

    CONSTRAINT "external_landlords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_landlord_contacts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalLandlordId" TEXT NOT NULL,
    "kind" "ExternalLandlordContactKind" NOT NULL,
    "label" TEXT,
    "valueEncrypted" TEXT NOT NULL,
    "normalizedValue" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,

    CONSTRAINT "external_landlord_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_landlord_permissions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalLandlordId" TEXT NOT NULL,
    "rentalListingId" TEXT,
    "kind" "ExternalLandlordPermissionKind" NOT NULL,
    "source" "ExternalLandlordEvidenceSource" NOT NULL DEFAULT 'manual',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT NOT NULL,

    CONSTRAINT "external_landlord_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_landlord_attachments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "externalLandlordId" TEXT NOT NULL,
    "rentalListingId" TEXT,
    "permissionId" TEXT,
    "source" "ExternalLandlordEvidenceSource",
    "label" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "fileUrl" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "external_landlord_attachments_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "rental_listings" ADD COLUMN "externalLandlordId" TEXT;

-- CreateIndex
CREATE INDEX "external_landlords_displayName_idx" ON "external_landlords"("displayName");

-- CreateIndex
CREATE INDEX "external_landlords_normalizedPrimaryEmail_idx" ON "external_landlords"("normalizedPrimaryEmail");

-- CreateIndex
CREATE INDEX "external_landlords_normalizedPrimaryPhone_idx" ON "external_landlords"("normalizedPrimaryPhone");

-- CreateIndex
CREATE INDEX "external_landlord_contacts_externalLandlordId_idx" ON "external_landlord_contacts"("externalLandlordId");

-- CreateIndex
CREATE INDEX "external_landlord_contacts_normalizedValue_idx" ON "external_landlord_contacts"("normalizedValue");

-- CreateIndex
CREATE INDEX "external_landlord_permissions_externalLandlordId_idx" ON "external_landlord_permissions"("externalLandlordId");

-- CreateIndex
CREATE INDEX "external_landlord_permissions_rentalListingId_idx" ON "external_landlord_permissions"("rentalListingId");

-- CreateIndex
CREATE INDEX "external_landlord_attachments_externalLandlordId_idx" ON "external_landlord_attachments"("externalLandlordId");

-- CreateIndex
CREATE INDEX "external_landlord_attachments_rentalListingId_idx" ON "external_landlord_attachments"("rentalListingId");

-- CreateIndex
CREATE INDEX "external_landlord_attachments_permissionId_idx" ON "external_landlord_attachments"("permissionId");

-- CreateIndex
CREATE INDEX "rental_listings_externalLandlordId_idx" ON "rental_listings"("externalLandlordId");

-- AddForeignKey
ALTER TABLE "rental_listings" ADD CONSTRAINT "rental_listings_externalLandlordId_fkey" FOREIGN KEY ("externalLandlordId") REFERENCES "external_landlords"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_landlord_contacts" ADD CONSTRAINT "external_landlord_contacts_externalLandlordId_fkey" FOREIGN KEY ("externalLandlordId") REFERENCES "external_landlords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_landlord_permissions" ADD CONSTRAINT "external_landlord_permissions_externalLandlordId_fkey" FOREIGN KEY ("externalLandlordId") REFERENCES "external_landlords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_landlord_permissions" ADD CONSTRAINT "external_landlord_permissions_rentalListingId_fkey" FOREIGN KEY ("rentalListingId") REFERENCES "rental_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_landlord_attachments" ADD CONSTRAINT "external_landlord_attachments_externalLandlordId_fkey" FOREIGN KEY ("externalLandlordId") REFERENCES "external_landlords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_landlord_attachments" ADD CONSTRAINT "external_landlord_attachments_rentalListingId_fkey" FOREIGN KEY ("rentalListingId") REFERENCES "rental_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_landlord_attachments" ADD CONSTRAINT "external_landlord_attachments_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "external_landlord_permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
