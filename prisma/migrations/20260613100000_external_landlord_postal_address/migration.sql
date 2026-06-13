-- AlterTable
ALTER TABLE "external_landlords"
    ADD COLUMN "postalStreet"  TEXT,
    ADD COLUMN "postalZip"     TEXT,
    ADD COLUMN "postalCity"    TEXT,
    ADD COLUMN "postalCountry" TEXT DEFAULT 'CH';
