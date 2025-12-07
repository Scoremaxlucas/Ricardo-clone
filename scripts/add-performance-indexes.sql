-- Performance-Indizes für schnelle Abfragen
-- Diese Indizes verbessern die Performance der Verkaufsseite drastisch

-- Index auf sellerId für schnelle Abfragen nach Verkäufer
CREATE INDEX IF NOT EXISTS "watches_sellerId_idx" ON "watches"("sellerId");

-- Zusammengesetzter Index für Sortierung nach createdAt bei sellerId-Filter
CREATE INDEX IF NOT EXISTS "watches_sellerId_createdAt_idx" ON "watches"("sellerId", "createdAt" DESC);

-- Index auf watchId in bids für schnelle Bid-Abfragen
CREATE INDEX IF NOT EXISTS "bids_watchId_idx" ON "bids"("watchId");

-- Zusammengesetzter Index für Sortierung nach amount bei watchId-Filter
CREATE INDEX IF NOT EXISTS "bids_watchId_amount_idx" ON "bids"("watchId", "amount" DESC);

-- Index auf watchId in purchases für schnelle Purchase-Abfragen
CREATE INDEX IF NOT EXISTS "purchases_watchId_idx" ON "purchases"("watchId");

-- Zusammengesetzter Index für Filterung nach Status bei watchId-Filter
CREATE INDEX IF NOT EXISTS "purchases_watchId_status_idx" ON "purchases"("watchId", "status");

