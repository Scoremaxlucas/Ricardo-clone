-- CreateEnum
CREATE TYPE "SicHouseholdKind" AS ENUM ('SINGLE', 'COUPLE');

-- AlterTable
ALTER TABLE "sic_certificates" ADD COLUMN "holder2FirstName" TEXT;
ALTER TABLE "sic_certificates" ADD COLUMN "holder2LastName" TEXT;
ALTER TABLE "sic_certificates" ADD COLUMN "householdKind" "SicHouseholdKind" NOT NULL DEFAULT 'SINGLE';
