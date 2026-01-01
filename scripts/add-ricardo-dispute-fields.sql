-- Ricardo-Style Dispute System Migration
-- Run this script to add all new dispute-related columns

-- === PURCHASE TABLE: Seller Response Fields ===
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "sellerResponseDeadline" TIMESTAMP(3);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "sellerRespondedAt" TIMESTAMP(3);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "sellerResponseText" TEXT;

-- === PURCHASE TABLE: Escalation Fields ===
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeEscalatedAt" TIMESTAMP(3);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeEscalationLevel" INTEGER DEFAULT 0;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeEscalationReason" TEXT;

-- === PURCHASE TABLE: Refund Management Fields ===
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeRefundRequired" BOOLEAN DEFAULT false;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeRefundAmount" DOUBLE PRECISION;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeRefundDeadline" TIMESTAMP(3);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeRefundCompletedAt" TIMESTAMP(3);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeRefundMethod" TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeRefundNote" TEXT;

-- === PURCHASE TABLE: Seller Consequences Fields ===
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "sellerWarningIssued" BOOLEAN DEFAULT false;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "sellerWarningIssuedAt" TIMESTAMP(3);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "sellerWarningReason" TEXT;

-- === PURCHASE TABLE: disputeInitiatedBy Field ===
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS "disputeInitiatedBy" TEXT;

-- === USER TABLE: Dispute Warning System Fields ===
ALTER TABLE users ADD COLUMN IF NOT EXISTS "disputeWarningCount" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastDisputeWarningAt" TIMESTAMP(3);
ALTER TABLE users ADD COLUMN IF NOT EXISTS "disputesLostCount" INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "disputeRestrictionLevel" TEXT;

-- === INDEXES for Performance ===
CREATE INDEX IF NOT EXISTS "purchases_disputeEscalationLevel_idx" ON purchases("disputeEscalationLevel");
CREATE INDEX IF NOT EXISTS "purchases_disputeRefundRequired_idx" ON purchases("disputeRefundRequired");
CREATE INDEX IF NOT EXISTS "purchases_sellerResponseDeadline_idx" ON purchases("sellerResponseDeadline");
CREATE INDEX IF NOT EXISTS "users_disputeWarningCount_idx" ON users("disputeWarningCount");
CREATE INDEX IF NOT EXISTS "users_disputeRestrictionLevel_idx" ON users("disputeRestrictionLevel");

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'purchases'
  AND column_name IN (
    'sellerResponseDeadline', 'sellerRespondedAt', 'sellerResponseText',
    'disputeEscalatedAt', 'disputeEscalationLevel', 'disputeEscalationReason',
    'disputeRefundRequired', 'disputeRefundAmount', 'disputeRefundDeadline',
    'disputeRefundCompletedAt', 'disputeRefundMethod', 'disputeRefundNote',
    'sellerWarningIssued', 'sellerWarningIssuedAt', 'sellerWarningReason',
    'disputeInitiatedBy'
  );

