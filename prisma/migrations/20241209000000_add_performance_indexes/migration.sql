-- CreateIndex
CREATE INDEX IF NOT EXISTS "watches_title_idx" ON "watches"("title");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "watches_brand_idx" ON "watches"("brand");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "watches_price_idx" ON "watches"("price");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "watches_articleNumber_idx" ON "watches"("articleNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "watches_auctionEnd_idx" ON "watches"("auctionEnd");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "watches_title_brand_idx" ON "watches"("title", "brand");
