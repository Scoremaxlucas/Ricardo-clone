-- Add delivery & shipping fields to Watch
ALTER TABLE "watches" ADD COLUMN IF NOT EXISTS "deliveryMode" TEXT DEFAULT 'shipping_and_pickup';
ALTER TABLE "watches" ADD COLUMN IF NOT EXISTS "freeShippingThresholdChf" DOUBLE PRECISION;
ALTER TABLE "watches" ADD COLUMN IF NOT EXISTS "pickupLocationZip" TEXT;
ALTER TABLE "watches" ADD COLUMN IF NOT EXISTS "pickupLocationCity" TEXT;
ALTER TABLE "watches" ADD COLUMN IF NOT EXISTS "pickupLocationAddress" TEXT;
ALTER TABLE "watches" ADD COLUMN IF NOT EXISTS "shippingProfile" TEXT;

-- Add shipping details to Order
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedDeliveryMode" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedShippingCode" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "selectedAddons" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCostChfFinal" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingCostBreakdown" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shippingRateSetId" TEXT DEFAULT 'default_ch_post';

-- Create ShippingRateCatalog table
CREATE TABLE IF NOT EXISTS "shipping_rate_catalog" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "labelDe" TEXT NOT NULL,
    "basePriceChf" DOUBLE PRECISION NOT NULL,
    "rateSetId" TEXT NOT NULL DEFAULT 'default_ch_post',
    "isAddon" BOOLEAN NOT NULL DEFAULT false,
    "addonType" TEXT,
    "service" TEXT,
    "weightTier" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_rate_catalog_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "shipping_rate_catalog_code_key" ON "shipping_rate_catalog"("code");
CREATE INDEX IF NOT EXISTS "shipping_rate_catalog_rateSetId_idx" ON "shipping_rate_catalog"("rateSetId");
CREATE INDEX IF NOT EXISTS "shipping_rate_catalog_code_idx" ON "shipping_rate_catalog"("code");
CREATE INDEX IF NOT EXISTS "shipping_rate_catalog_isActive_idx" ON "shipping_rate_catalog"("isActive");
CREATE INDEX IF NOT EXISTS "shipping_rate_catalog_isAddon_idx" ON "shipping_rate_catalog"("isAddon");
