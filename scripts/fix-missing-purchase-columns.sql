-- =====================================================
-- FIX: Add missing columns to 'purchases' table
-- Run this on Vercel PostgreSQL Console
-- =====================================================

-- Check if columns exist, and add them if not

-- Dispute System Enhancement Columns
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeDeadline" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeFrozenAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeAttachments" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderSentAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderCount" INTEGER NOT NULL DEFAULT 0;

-- Stripe Integration Columns
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundStatus" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundedAt" TIMESTAMP(3);

-- Create index for dispute status queries (if not exists)
CREATE INDEX IF NOT EXISTS "purchases_disputeStatus_idx" ON "purchases"("disputeStatus");

-- Create DisputeComment table if not exists
CREATE TABLE IF NOT EXISTS "dispute_comments" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispute_comments_pkey" PRIMARY KEY ("id")
);

-- Create indexes for DisputeComment
CREATE INDEX IF NOT EXISTS "dispute_comments_purchaseId_idx" ON "dispute_comments"("purchaseId");
CREATE INDEX IF NOT EXISTS "dispute_comments_purchaseId_createdAt_idx" ON "dispute_comments"("purchaseId", "createdAt");

-- Add foreign key constraints (use DO block to handle if already exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dispute_comments_purchaseId_fkey'
    ) THEN
        ALTER TABLE "dispute_comments" 
        ADD CONSTRAINT "dispute_comments_purchaseId_fkey" 
        FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'dispute_comments_userId_fkey'
    ) THEN
        ALTER TABLE "dispute_comments" 
        ADD CONSTRAINT "dispute_comments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- =====================================================
-- Verify the changes
-- =====================================================
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'purchases' 
AND column_name IN (
    'disputeDeadline', 
    'disputeFrozenAt', 
    'disputeAttachments', 
    'disputeReminderSentAt', 
    'disputeReminderCount',
    'stripePaymentIntentId',
    'stripeRefundId',
    'stripeRefundStatus',
    'stripeRefundedAt'
);
