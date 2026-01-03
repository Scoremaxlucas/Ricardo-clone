#!/bin/bash
set -e

# Fix nodemailer version in package.json before installing
echo "🔧 Updating nodemailer version in package.json..."
sed -i.bak 's/"nodemailer": "\^6\.10\.1"/"nodemailer": "^7.0.11"/g' package.json || true
sed -i.bak 's/"nodemailer": "\^7\.0\.7"/"nodemailer": "^7.0.11"/g' package.json || true

# Install dependencies with legacy peer deps
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "🔨 Generating Prisma client..."
npx prisma generate

# CRITICAL: Push database schema to ensure all columns exist
echo "🗄️ Pushing database schema..."
if npx prisma db push --accept-data-loss; then
  echo "✅ Database schema pushed successfully"
else
  echo "⚠️ Database push failed - attempting manual column fixes..."
  # Try to add critical missing columns manually
  npx prisma db execute --stdin <<'SQLEOF'
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
SQLEOF
  echo "✅ Manual column fixes applied (including Ricardo-Style dispute columns)"
fi

# Create monitoring tables if they don't exist
echo "📊 Creating monitoring tables..."
npx prisma db execute --stdin <<'SQLEOF' || true
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














