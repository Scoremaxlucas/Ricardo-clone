-- Swiss Immo Cert: geprüfte Werte, Gültigkeit ab Freigabe, Verlängerung, Messbarkeit.

-- Geprüfte Werte je Modul (Struktur in src/lib/sic/facts.ts).
ALTER TABLE "sic_certificate_modules" ADD COLUMN IF NOT EXISTS "verifiedFacts" JSONB;

-- Ausstellungsdatum = erste Freigabe; Gültigkeit erst ab dann.
ALTER TABLE "sic_certificates" ADD COLUMN IF NOT EXISTS "certifiedAt" TIMESTAMP(3);
ALTER TABLE "sic_certificates" ADD COLUMN IF NOT EXISTS "docsPurgeWarningSentAt" TIMESTAMP(3);
ALTER TABLE "sic_certificates" ALTER COLUMN "expiresAt" DROP NOT NULL;

-- Bestand: bereits freigegebene Zertifikate behalten ihr Datum, unfertige starten neu.
UPDATE "sic_certificates" c
SET "certifiedAt" = sub."firstReviewedAt"
FROM (
  SELECT "certificateId", MIN("reviewedAt") AS "firstReviewedAt"
  FROM "sic_certificate_modules"
  WHERE "status" = 'VERIFIED' AND "reviewedAt" IS NOT NULL
  GROUP BY "certificateId"
) AS sub
WHERE c."id" = sub."certificateId" AND c."certifiedAt" IS NULL;

UPDATE "sic_certificates"
SET "expiresAt" = NULL
WHERE "certifiedAt" IS NULL AND "status" = 'ACTIVE';

CREATE INDEX IF NOT EXISTS "sic_certificates_certifiedAt_idx" ON "sic_certificates"("certifiedAt");

-- Verlängerung als eigener Zahlungszweck.
ALTER TABLE "sic_payments" ADD COLUMN IF NOT EXISTS "isRenewal" BOOLEAN NOT NULL DEFAULT false;

-- Scans der Prüfseite durch Dritte, entdoppelt pro Zertifikat/Tag/IP.
CREATE TABLE IF NOT EXISTS "sic_verify_scans" (
  "id" TEXT NOT NULL,
  "certificateId" TEXT NOT NULL,
  "dayKey" TEXT NOT NULL,
  "ipHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sic_verify_scans_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "sic_verify_scans_certificateId_dayKey_ipHash_key"
  ON "sic_verify_scans"("certificateId", "dayKey", "ipHash");
CREATE INDEX IF NOT EXISTS "sic_verify_scans_certificateId_createdAt_idx"
  ON "sic_verify_scans"("certificateId", "createdAt");
CREATE INDEX IF NOT EXISTS "sic_verify_scans_createdAt_idx" ON "sic_verify_scans"("createdAt");

DO $$ BEGIN
  ALTER TABLE "sic_verify_scans"
    ADD CONSTRAINT "sic_verify_scans_certificateId_fkey"
    FOREIGN KEY ("certificateId") REFERENCES "sic_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Funnel-Ereignisse.
DO $$ BEGIN
  CREATE TYPE "SicEventKind" AS ENUM (
    'CERTIFICATE_CREATED',
    'FIRST_UPLOAD',
    'MODULE_VERIFIED',
    'MODULE_REJECTED',
    'PDF_DOWNLOADED',
    'VERIFY_SCANNED',
    'RENEWAL_PURCHASED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "sic_events" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "kind" "SicEventKind" NOT NULL,
  "certificateId" TEXT,
  "email" TEXT,
  "moduleKind" "SicModuleKind",
  "meta" JSONB,
  CONSTRAINT "sic_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "sic_events_kind_createdAt_idx" ON "sic_events"("kind", "createdAt");
CREATE INDEX IF NOT EXISTS "sic_events_certificateId_kind_idx" ON "sic_events"("certificateId", "kind");

DO $$ BEGIN
  ALTER TABLE "sic_events"
    ADD CONSTRAINT "sic_events_certificateId_fkey"
    FOREIGN KEY ("certificateId") REFERENCES "sic_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
