-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "helvenda_certificates" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantProfileId" TEXT NOT NULL,
    "certificateCode" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "verifiedFirstName" TEXT NOT NULL,
    "verifiedLastName" TEXT NOT NULL,
    "verifiedAddress" TEXT NOT NULL,
    "verifiedCity" TEXT NOT NULL,
    "verifiedZip" TEXT NOT NULL,
    "verifiedEmploymentStatus" TEXT NOT NULL,
    "verifiedEmployer" TEXT,
    "verifiedIncomeCategory" TEXT NOT NULL,
    "verifiedCreditCheckStatus" TEXT NOT NULL,
    "verifiedCreditCheckDate" TIMESTAMP(3) NOT NULL,
    "verifiedCreditCheckCanton" TEXT NOT NULL,
    "verifiedCreditEntryCount" INTEGER NOT NULL,
    "incomeQualifiesUpTo" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "verificationCount" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "helvenda_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "helvenda_certificates_certificateCode_key" ON "helvenda_certificates"("certificateCode");

-- CreateIndex
CREATE INDEX "helvenda_certificates_certificateCode_idx" ON "helvenda_certificates"("certificateCode");

-- CreateIndex
CREATE INDEX "helvenda_certificates_userId_idx" ON "helvenda_certificates"("userId");

-- CreateIndex
CREATE INDEX "helvenda_certificates_tenantProfileId_idx" ON "helvenda_certificates"("tenantProfileId");

-- AddForeignKey
ALTER TABLE "helvenda_certificates" ADD CONSTRAINT "helvenda_certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "helvenda_certificates" ADD CONSTRAINT "helvenda_certificates_tenantProfileId_fkey" FOREIGN KEY ("tenantProfileId") REFERENCES "tenant_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
