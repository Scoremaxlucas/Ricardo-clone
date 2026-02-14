-- Add CASCADE/RESTRICT delete rules for Watch relations
-- Prevents orphaned records and protects financial data

-- Bids: CASCADE (meaningless without the watch)
ALTER TABLE "bids" DROP CONSTRAINT IF EXISTS "bids_watchId_fkey";
ALTER TABLE "bids" ADD CONSTRAINT "bids_watchId_fkey"
  FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MaxBids: CASCADE (meaningless without the watch)
ALTER TABLE "max_bids" DROP CONSTRAINT IF EXISTS "max_bids_watchId_fkey";
ALTER TABLE "max_bids" ADD CONSTRAINT "max_bids_watchId_fkey"
  FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Favorites: CASCADE (meaningless without the watch)
ALTER TABLE "favorites" DROP CONSTRAINT IF EXISTS "favorites_watchId_fkey";
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_watchId_fkey"
  FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WatchCategories: CASCADE (join table, meaningless without the watch)
ALTER TABLE "watch_categories" DROP CONSTRAINT IF EXISTS "watch_categories_watchId_fkey";
ALTER TABLE "watch_categories" ADD CONSTRAINT "watch_categories_watchId_fkey"
  FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Messages: CASCADE (Q&A meaningless without the watch)
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_watchId_fkey";
ALTER TABLE "messages" ADD CONSTRAINT "messages_watchId_fkey"
  FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Purchases: RESTRICT (financial records must be preserved)
ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "purchases_watchId_fkey";
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_watchId_fkey"
  FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Orders: RESTRICT (financial records must be preserved)
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_watchId_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_watchId_fkey"
  FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- InvoiceItems: SET NULL (preserve invoice item, clear watch reference)
ALTER TABLE "invoice_items" DROP CONSTRAINT IF EXISTS "invoice_items_watchId_fkey";
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_watchId_fkey"
  FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
