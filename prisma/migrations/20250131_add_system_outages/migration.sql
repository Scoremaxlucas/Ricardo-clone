-- CreateTable: System Outages for automatic auction extensions
-- Diese Tabelle speichert Systemausfälle und ermöglicht automatische Auktionsverlängerungen

CREATE TABLE IF NOT EXISTS "system_outages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "severity" TEXT NOT NULL DEFAULT 'major',
    "affectedServices" TEXT[],
    "isPlanned" BOOLEAN NOT NULL DEFAULT false,
    "extensionApplied" BOOLEAN NOT NULL DEFAULT false,
    "extensionMinutes" INTEGER,
    "auctionsExtended" INTEGER,
    "extensionAppliedAt" TIMESTAMP(3),
    "extensionAppliedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "resolvedBy" TEXT,

    CONSTRAINT "system_outages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "system_outages_startedAt_idx" ON "system_outages"("startedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "system_outages_endedAt_idx" ON "system_outages"("endedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "system_outages_severity_idx" ON "system_outages"("severity");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "system_outages_extensionApplied_idx" ON "system_outages"("extensionApplied");

-- AddForeignKey
ALTER TABLE "system_outages" ADD CONSTRAINT "system_outages_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_outages" ADD CONSTRAINT "system_outages_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_outages" ADD CONSTRAINT "system_outages_extensionAppliedBy_fkey" FOREIGN KEY ("extensionAppliedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
