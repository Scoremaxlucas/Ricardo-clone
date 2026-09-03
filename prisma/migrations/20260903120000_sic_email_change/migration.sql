-- AlterTable
ALTER TABLE "sic_certificates" ADD COLUMN "emailChangedAt" TIMESTAMP(3);
ALTER TABLE "sic_certificates" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "sic_certificates" ADD COLUMN "pendingEmailToken" TEXT;
ALTER TABLE "sic_certificates" ADD COLUMN "pendingEmailExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "sic_certificates_pendingEmailToken_key" ON "sic_certificates"("pendingEmailToken");
