#!/bin/bash
set -e

# NOTE: npm install is already done by Vercel before this script runs
# We generate the client, apply versioned migrations (Phase 2+), then legacy db push / fixes.

# Generate Prisma client (in case cache is stale)
echo "🔨 Generating Prisma client..."
npx prisma generate

# Versionierte Schema-Änderungen — nutzt DATABASE_URL aus Vercel.
# P3005: DB hat Tabellen, aber keine (oder leere) Prisma-Migrations-Historie (häufig nach langem db push).
# Dann: alle Migrationen außer Matching Phase 2 als "bereits angewendet" markieren, danach nur Phase 2 ausführen
# (Rental-Migration 20260406 würde sonst DROP/CREATE auf bestehende rental_* laufen).
echo "📦 Applying Prisma migrations (prisma migrate deploy)..."
MATCH_PHASE2="20260405120000_matching_mvp_phase2"

# P1002 auf Vercel/Neon: Standard-Advisory-Lock-Timeout (10s) reicht oft nicht (Pooler, parallele Deploys).
# Überschreibbar in Vercel: PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT (Millisekunden).
export PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT="${PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT:-180000}"

# Nach P3018 (fehlgeschlagene Migration): Eintrag zurücksetzen, damit korrigierte SQL erneut laufen darf
npx prisma migrate resolve --rolled-back "$MATCH_PHASE2" 2>/dev/null || true

# P3009: fehlgeschlagene Migration 20260424120000 (FK zeigte fälschlich auf "User" statt "users") — einmalig zurücksetzen
INVITE_MIGRATION="20260424120000_rental_listing_invite"
npx prisma migrate resolve --rolled-back "$INVITE_MIGRATION" 2>/dev/null || true

DEPLOY_CODE=1
DEPLOY_OUT=""
for attempt in 1 2 3 4; do
  set +e
  DEPLOY_OUT=$(npx prisma migrate deploy 2>&1)
  DEPLOY_CODE=$?
  set -e
  echo "$DEPLOY_OUT"
  if [ "$DEPLOY_CODE" -eq 0 ]; then
    break
  fi
  if echo "$DEPLOY_OUT" | grep -q "P1002"; then
    echo "⚠️ P1002 (Advisory-Lock / DB-Timeout), Wiederholung $attempt/4 in 25s …"
    sleep 25
    continue
  fi
  break
done

if [ "$DEPLOY_CODE" -ne 0 ]; then
  if echo "$DEPLOY_OUT" | grep -q "P3005"; then
    echo "⚠️ P3005: baseline — markiere historische Migrationen als angewendet, Matching Phase 2 bleibt pending."
    while IFS= read -r sqlfile; do
      dir=$(dirname "$sqlfile")
      name=$(basename "$dir")
      if [ "$name" = "$MATCH_PHASE2" ]; then
        continue
      fi
      echo "  prisma migrate resolve --applied \"$name\""
      npx prisma migrate resolve --applied "$name" || true
    done < <(find prisma/migrations -mindepth 2 -maxdepth 2 -name migration.sql | sort)
    echo "📦 Erneuter prisma migrate deploy (erwartet: nur $MATCH_PHASE2)..."
    npx prisma migrate resolve --rolled-back "$MATCH_PHASE2" 2>/dev/null || true
    npx prisma migrate deploy
  else
    exit "$DEPLOY_CODE"
  fi
fi

# Schema-Änderungen laufen ausschliesslich über versionierte Migrationen (oben).
# `prisma db push --accept-data-loss` ist bewusst entfernt: es konnte Spalten und
# damit Daten löschen und hat Migrationsfehler stillschweigend übergangen.
# Scheitert `migrate deploy`, bricht der Build ab — das ist gewollt.

# ALWAYS run manual column fixes to ensure all columns exist
echo "🔧 Ensuring all required columns exist..."
# Try to add critical missing columns manually
npx prisma db execute --schema prisma/schema.prisma --stdin <<'SQLEOF' || true
-- Existing dispute columns
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeDeadline" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeFrozenAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeAttachments" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderSentAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundStatus" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundedAt" TIMESTAMP(3);

-- Ricardo-Style: Seller Response Fields
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeInitiatedBy" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "sellerResponseDeadline" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "sellerRespondedAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "sellerResponseText" TEXT;

-- Ricardo-Style: Escalation Fields
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeEscalatedAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeEscalationLevel" INTEGER DEFAULT 0;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeEscalationReason" TEXT;

-- Ricardo-Style: Refund Management Fields
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeRefundRequired" BOOLEAN DEFAULT false;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeRefundAmount" DOUBLE PRECISION;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeRefundDeadline" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeRefundCompletedAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeRefundMethod" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeRefundNote" TEXT;

-- Ricardo-Style: Seller Consequences Fields
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "sellerWarningIssued" BOOLEAN DEFAULT false;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "sellerWarningIssuedAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "sellerWarningReason" TEXT;

-- Basic User Warning Fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "warningCount" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastWarnedAt" TIMESTAMP(3);

-- Ricardo-Style: User Warning Fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "disputeWarningCount" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastDisputeWarningAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "disputesLostCount" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "disputeRestrictionLevel" TEXT;

-- Password Reset Fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetTokenExpires" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);

-- Login Security Fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginIp" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastLoginDevice" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "loginNotificationsEnabled" BOOLEAN DEFAULT true;

-- Invoice Mahnstopp (Collection Stop) Fields
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionStopped" BOOLEAN DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionStoppedAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionStoppedBy" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionStoppedReason" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionResumedAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentArrangement" BOOLEAN DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentArrangementDate" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentArrangementNotes" TEXT;

-- Sofortkauf Listing Expiry (Auto-Renew) Fields (Prisma @@map("watches"))
ALTER TABLE "watches" ADD COLUMN IF NOT EXISTS "listingExpiresAt" TIMESTAMP(3);
ALTER TABLE "watches" ADD COLUMN IF NOT EXISTS "listingDurationDays" INTEGER DEFAULT 30;
SQLEOF
echo "✅ All required columns ensured"

# Create monitoring tables if they don't exist
echo "📊 Creating monitoring tables..."
npx prisma db execute --schema prisma/schema.prisma --stdin <<'SQLEOF' || true
-- RateLimit table for rate limiting
CREATE TABLE IF NOT EXISTS "rate_limits" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "rate_limits_identifier_createdAt_idx" ON "rate_limits"("identifier", "createdAt");
CREATE INDEX IF NOT EXISTS "rate_limits_createdAt_idx" ON "rate_limits"("createdAt");

-- WebhookMetric table for monitoring
CREATE TABLE IF NOT EXISTS "webhook_metrics" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "processingTimeMs" INTEGER NOT NULL,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "webhook_metrics_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "webhook_metrics_timestamp_idx" ON "webhook_metrics"("timestamp");
CREATE INDEX IF NOT EXISTS "webhook_metrics_eventType_timestamp_idx" ON "webhook_metrics"("eventType", "timestamp");
CREATE INDEX IF NOT EXISTS "webhook_metrics_success_timestamp_idx" ON "webhook_metrics"("success", "timestamp");

-- AlertLog table for alert tracking
CREATE TABLE IF NOT EXISTS "alert_logs" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "details" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "alert_logs_alertType_sentAt_idx" ON "alert_logs"("alertType", "sentAt");
CREATE INDEX IF NOT EXISTS "alert_logs_sentAt_idx" ON "alert_logs"("sentAt");
SQLEOF
echo "✅ Monitoring tables created"

# Build Next.js app
echo "🏗️ Building Next.js app..."
next build














