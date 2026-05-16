-- AlterTable
ALTER TABLE "rental_applications" ADD COLUMN "landlordLeadToken" TEXT;
ALTER TABLE "rental_applications" ADD COLUMN "landlordLeadTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "rental_applications" ADD COLUMN "landlordRespondedAt" TIMESTAMP(3);
ALTER TABLE "rental_applications" ADD COLUMN "landlordNoResponseNotifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "rental_applications_landlordLeadToken_key" ON "rental_applications"("landlordLeadToken");
