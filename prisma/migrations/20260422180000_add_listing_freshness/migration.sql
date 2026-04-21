-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('UNCHECKED', 'ACTIVE', 'GONE', 'RENTED', 'UNREACHABLE', 'MANUAL');

-- CreateEnum
CREATE TYPE "DeactivationReason" AS ENUM ('URL_404', 'URL_RENTED', 'STALE_REPORTS', 'MANUAL_ADMIN');

-- AlterTable
ALTER TABLE "rental_listings" ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "lastCheckStatus" "CheckStatus" NOT NULL DEFAULT 'UNCHECKED',
ADD COLUMN     "staleReportCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "staleReportedAt" TIMESTAMP(3),
ADD COLUMN     "autoDeactivatedAt" TIMESTAMP(3),
ADD COLUMN     "autoDeactivatedReason" "DeactivationReason",
ADD COLUMN     "urlUnreachableStreak" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "rental_applications" ADD COLUMN "staleReportedAt" TIMESTAMP(3),
ADD COLUMN     "staleReportNote" TEXT;

-- CreateIndex
CREATE INDEX "rental_listings_status_lastCheckedAt_idx" ON "rental_listings"("status", "lastCheckedAt");
