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
SQLEOF
  echo "✅ Manual column fixes applied (including Ricardo-Style dispute columns)"
fi

# Build Next.js app
echo "🏗️ Building Next.js app..."
next build














