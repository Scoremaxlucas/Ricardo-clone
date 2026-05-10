-- Wohnen async mail retries + admin audit trail

CREATE TYPE "WohnenEmailOutboxKind" AS ENUM ('TENANT_APPLICATION_CONFIRM');

CREATE TYPE "WohnenEmailOutboxStatus" AS ENUM ('pending', 'sending', 'sent', 'failed', 'cancelled');

CREATE TABLE "wohnen_email_outbox" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" "WohnenEmailOutboxKind" NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" "WohnenEmailOutboxStatus" NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "sentAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "rentalApplicationId" TEXT,
    "applicantUserId" TEXT,

    CONSTRAINT "wohnen_email_outbox_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wohnen_email_outbox_dedupeKey_key" ON "wohnen_email_outbox"("dedupeKey");

CREATE INDEX "wohnen_email_outbox_status_nextAttemptAt_idx" ON "wohnen_email_outbox"("status", "nextAttemptAt");

CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_entityType_entityId_idx" ON "admin_audit_logs"("entityType", "entityId");

CREATE INDEX "admin_audit_logs_adminUserId_createdAt_idx" ON "admin_audit_logs"("adminUserId", "createdAt");
