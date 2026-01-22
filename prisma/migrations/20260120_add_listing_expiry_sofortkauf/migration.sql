-- Sofortkauf: Laufzeit mit automatischer Verlängerung
-- listingExpiresAt = Ablaufdatum; listingDurationDays = Verlängerungsdauer (z.B. 30)

ALTER TABLE "Watch" ADD COLUMN IF NOT EXISTS "listingExpiresAt" TIMESTAMP(3);
ALTER TABLE "Watch" ADD COLUMN IF NOT EXISTS "listingDurationDays" INTEGER DEFAULT 30;
