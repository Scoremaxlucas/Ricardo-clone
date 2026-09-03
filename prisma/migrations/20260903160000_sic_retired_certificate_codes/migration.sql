-- CreateTable
CREATE TABLE "sic_retired_certificate_codes" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateCode" TEXT NOT NULL,
    "replacedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateId" TEXT,

    CONSTRAINT "sic_retired_certificate_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sic_retired_certificate_codes_certificateCode_key" ON "sic_retired_certificate_codes"("certificateCode");

-- CreateIndex
CREATE INDEX "sic_retired_certificate_codes_certificateId_idx" ON "sic_retired_certificate_codes"("certificateId");

-- AddForeignKey
ALTER TABLE "sic_retired_certificate_codes" ADD CONSTRAINT "sic_retired_certificate_codes_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "sic_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
