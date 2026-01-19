-- Add notification preference columns to user_preferences table
-- These columns were missing from the initial table creation

ALTER TABLE "user_preferences"
ADD COLUMN IF NOT EXISTS "emailOnNewMessage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOnNewBid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOnNewOffer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOnSaleCompleted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOnOutbid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOnAuctionEnding" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOnPurchase" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOnShipping" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOnSearchMatch" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "emailOnFavoritePriceChange" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "emailMarketing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "emailDigestFrequency" TEXT NOT NULL DEFAULT 'instant';

-- Add comment for documentation
COMMENT ON COLUMN "user_preferences"."emailOnNewMessage" IS 'Neue Nachricht zu Inserat';
COMMENT ON COLUMN "user_preferences"."emailOnNewBid" IS 'Neues Gebot auf Auktion';
COMMENT ON COLUMN "user_preferences"."emailOnNewOffer" IS 'Neues Preisangebot';
COMMENT ON COLUMN "user_preferences"."emailOnSaleCompleted" IS 'Verkauf abgeschlossen';
COMMENT ON COLUMN "user_preferences"."emailOnOutbid" IS 'Überboten bei Auktion';
COMMENT ON COLUMN "user_preferences"."emailOnAuctionEnding" IS 'Auktion endet bald (30 min)';
COMMENT ON COLUMN "user_preferences"."emailOnPurchase" IS 'Kauf bestätigt';
COMMENT ON COLUMN "user_preferences"."emailOnShipping" IS 'Artikel versendet';
COMMENT ON COLUMN "user_preferences"."emailOnSearchMatch" IS 'Neuer Treffer für Suchabo';
COMMENT ON COLUMN "user_preferences"."emailOnFavoritePriceChange" IS 'Preisänderung bei Favorit';
COMMENT ON COLUMN "user_preferences"."emailMarketing" IS 'Newsletter & Angebote';
COMMENT ON COLUMN "user_preferences"."emailDigestFrequency" IS 'E-Mail-Häufigkeit: instant, daily, weekly, none';
