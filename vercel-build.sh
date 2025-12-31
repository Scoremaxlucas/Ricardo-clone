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
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeDeadline" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeFrozenAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeAttachments" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderSentAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundStatus" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundedAt" TIMESTAMP(3);
SQLEOF
  echo "✅ Manual column fixes applied"
fi

# Build Next.js app
echo "🏗️ Building Next.js app..."
next build














