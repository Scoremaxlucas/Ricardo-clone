-- Add missing columns to orders table for Ricardo-style payment flow

-- Payment method column (stripe | bank_transfer | cash_on_pickup)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;

-- Payment deadline and reminders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentDeadline" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReminderSentAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentReminderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentDeadlineMissed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paymentDeadlineMissedAt" TIMESTAMP(3);

-- Auto-cancellation
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "autoCancelledAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "autoCancelReason" TEXT;

-- Contact info for pickup/direct payment
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contactDeadline" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "sellerContactedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "buyerContactedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contactWarningSentAt" TIMESTAMP(3);

-- Selected delivery mode (shipping | pickup)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedDeliveryMode" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedShippingCode" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedAddons" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCostChfFinal" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCostBreakdown" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingRateSetId" TEXT DEFAULT 'default_ch_post';
