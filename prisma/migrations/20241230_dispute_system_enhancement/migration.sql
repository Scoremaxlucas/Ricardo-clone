-- Enhanced Dispute System Migration
-- Adds new fields to Purchase table and creates DisputeComment table

-- Add new dispute fields to Purchase table
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeInitiatedBy" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeDeadline" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeFrozenAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeAttachments" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderSentAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderCount" INTEGER NOT NULL DEFAULT 0;

-- Add Stripe integration fields
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundStatus" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundedAt" TIMESTAMP(3);

-- Create index for dispute status queries
CREATE INDEX IF NOT EXISTS "purchases_disputeStatus_idx" ON "purchases"("disputeStatus");

-- Create DisputeComment table for comment/history tracking
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

-- Add foreign key constraints
ALTER TABLE "dispute_comments" ADD CONSTRAINT "dispute_comments_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dispute_comments" ADD CONSTRAINT "dispute_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
