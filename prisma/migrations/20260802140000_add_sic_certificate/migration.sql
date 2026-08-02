-- CreateEnum
CREATE TYPE "SicCertificateStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "SicModuleKind" AS ENUM ('BONITAET', 'ARBEIT_EINKOMMEN', 'ZUVERLAESSIGKEIT', 'AUFENTHALT');

-- CreateEnum
CREATE TYPE "SicModuleStatus" AS ENUM ('PENDING_DOCS', 'IN_REVIEW', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SicPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- CreateTable
CREATE TABLE "sic_certificates" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "certificateCode" TEXT NOT NULL,
    "holderFirstName" TEXT,
    "holderLastName" TEXT,
    "status" "SicCertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verificationCount" INTEGER NOT NULL DEFAULT 0,
    "lastVerifiedAt" TIMESTAMP(3),
    "expiryReminder14dSentAt" TIMESTAMP(3),
    "expiryReminder3dSentAt" TIMESTAMP(3),

    CONSTRAINT "sic_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sic_certificate_modules" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "moduleKind" "SicModuleKind" NOT NULL,
    "status" "SicModuleStatus" NOT NULL DEFAULT 'PENDING_DOCS',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sic_certificate_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sic_documents" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "moduleKind" "SicModuleKind" NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sic_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sic_payments" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "certificateId" TEXT,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "includeBaseFee" BOOLEAN NOT NULL,
    "moduleKinds" TEXT[],
    "amountChf" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CHF',
    "status" "SicPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "sic_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sic_magic_links" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "sic_magic_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sic_certificates_email_key" ON "sic_certificates"("email");
CREATE UNIQUE INDEX "sic_certificates_certificateCode_key" ON "sic_certificates"("certificateCode");
CREATE INDEX "sic_certificates_certificateCode_idx" ON "sic_certificates"("certificateCode");
CREATE INDEX "sic_certificates_email_idx" ON "sic_certificates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sic_certificate_modules_certificateId_moduleKind_key" ON "sic_certificate_modules"("certificateId", "moduleKind");
CREATE INDEX "sic_certificate_modules_certificateId_idx" ON "sic_certificate_modules"("certificateId");

-- CreateIndex
CREATE INDEX "sic_documents_certificateId_idx" ON "sic_documents"("certificateId");
CREATE INDEX "sic_documents_certificateId_moduleKind_idx" ON "sic_documents"("certificateId", "moduleKind");

-- CreateIndex
CREATE UNIQUE INDEX "sic_payments_stripeCheckoutSessionId_key" ON "sic_payments"("stripeCheckoutSessionId");
CREATE INDEX "sic_payments_email_idx" ON "sic_payments"("email");
CREATE INDEX "sic_payments_certificateId_idx" ON "sic_payments"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "sic_magic_links_token_key" ON "sic_magic_links"("token");
CREATE INDEX "sic_magic_links_email_idx" ON "sic_magic_links"("email");
CREATE INDEX "sic_magic_links_token_idx" ON "sic_magic_links"("token");

-- AddForeignKey
ALTER TABLE "sic_certificate_modules" ADD CONSTRAINT "sic_certificate_modules_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "sic_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sic_documents" ADD CONSTRAINT "sic_documents_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "sic_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sic_payments" ADD CONSTRAINT "sic_payments_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "sic_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
