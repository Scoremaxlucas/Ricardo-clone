-- Add payment deadline tracking
ALTER TABLE "purchases" ADD COLUMN "paymentDeadline" DATETIME;
ALTER TABLE "purchases" ADD COLUMN "paymentReminderSentAt" DATETIME;
ALTER TABLE "purchases" ADD COLUMN "paymentDeadlineMissed" BOOLEAN NOT NULL DEFAULT 0;

-- Set default paymentDeadline for existing purchases (7 days from createdAt + 14 days = 21 days from now)
UPDATE "purchases" SET "paymentDeadline" = datetime("createdAt", '+21 days') WHERE "paymentDeadline" IS NULL AND "createdAt" IS NOT NULL;

-- Add shipping tracking
ALTER TABLE "purchases" ADD COLUMN "trackingNumber" TEXT;
ALTER TABLE "purchases" ADD COLUMN "trackingProvider" TEXT;
ALTER TABLE "purchases" ADD COLUMN "shippedAt" DATETIME;
ALTER TABLE "purchases" ADD COLUMN "estimatedDeliveryDate" DATETIME;

-- Add dispute system
ALTER TABLE "purchases" ADD COLUMN "disputeOpenedAt" DATETIME;
ALTER TABLE "purchases" ADD COLUMN "disputeReason" TEXT;
ALTER TABLE "purchases" ADD COLUMN "disputeStatus" TEXT;
ALTER TABLE "purchases" ADD COLUMN "disputeResolvedAt" DATETIME;
ALTER TABLE "purchases" ADD COLUMN "disputeResolvedBy" TEXT;

-- Add status history
ALTER TABLE "purchases" ADD COLUMN "statusHistory" TEXT;

