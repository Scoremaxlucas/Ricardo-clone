-- Migration: Add Homepage Enhancement Features (PostgreSQL Version)
-- Phase 0: Foundation - All database tables for 10 homepage features
-- Created: 2025-01-11
-- PostgreSQL-compatible version for Vercel deployment

-- Feature 1: Intelligente Suche - Search Analytics
CREATE TABLE IF NOT EXISTS "search_queries" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clicked" BOOLEAN NOT NULL DEFAULT false,
    "clickedWatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "search_queries_query_idx" ON "search_queries"("query");
CREATE INDEX IF NOT EXISTS "search_queries_createdAt_idx" ON "search_queries"("createdAt");
CREATE INDEX IF NOT EXISTS "search_queries_userId_idx" ON "search_queries"("userId");
CREATE INDEX IF NOT EXISTS "search_queries_category_idx" ON "search_queries"("category");

ALTER TABLE "search_queries" ADD CONSTRAINT "search_queries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Feature 2: Social Proof - Product Statistics
CREATE TABLE IF NOT EXISTS "product_stats" (
    "id" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "soldLast24h" INTEGER NOT NULL DEFAULT 0,
    "viewersNow" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_stats_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_stats_watchId_key" UNIQUE ("watchId")
);

CREATE INDEX IF NOT EXISTS "product_stats_watchId_idx" ON "product_stats"("watchId");
CREATE INDEX IF NOT EXISTS "product_stats_lastUpdated_idx" ON "product_stats"("lastUpdated");

ALTER TABLE "product_stats" ADD CONSTRAINT "product_stats_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Feature 4: Smart Collections
CREATE TABLE IF NOT EXISTS "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'user',
    "userId" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "collections_userId_idx" ON "collections"("userId");
CREATE INDEX IF NOT EXISTS "collections_type_idx" ON "collections"("type");
CREATE INDEX IF NOT EXISTS "collections_createdAt_idx" ON "collections"("createdAt");

ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "collection_items" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "collection_items_collectionId_watchId_key" UNIQUE ("collectionId", "watchId")
);

CREATE INDEX IF NOT EXISTS "collection_items_collectionId_idx" ON "collection_items"("collectionId");
CREATE INDEX IF NOT EXISTS "collection_items_watchId_idx" ON "collection_items"("watchId");
CREATE INDEX IF NOT EXISTS "collection_items_order_idx" ON "collection_items"("order");

ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Feature 5: Personalisierung
CREATE TABLE IF NOT EXISTS "browsing_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER DEFAULT 0,
    "action" TEXT NOT NULL DEFAULT 'view',
    CONSTRAINT "browsing_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "browsing_history_userId_idx" ON "browsing_history"("userId");
CREATE INDEX IF NOT EXISTS "browsing_history_userId_viewedAt_idx" ON "browsing_history"("userId", "viewedAt");
CREATE INDEX IF NOT EXISTS "browsing_history_watchId_idx" ON "browsing_history"("watchId");
CREATE INDEX IF NOT EXISTS "browsing_history_action_idx" ON "browsing_history"("action");

ALTER TABLE "browsing_history" ADD CONSTRAINT "browsing_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "browsing_history" ADD CONSTRAINT "browsing_history_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredCategories" TEXT,
    "priceRange" TEXT,
    "preferredBrands" TEXT,
    "preferredConditions" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_preferences_userId_key" UNIQUE ("userId")
);

CREATE INDEX IF NOT EXISTS "user_preferences_userId_idx" ON "user_preferences"("userId");

ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Feature 6: Live-Auktionen
CREATE TABLE IF NOT EXISTS "auction_viewers" (
    "id" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "userId" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auction_viewers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "auction_viewers_watchId_idx" ON "auction_viewers"("watchId");
CREATE INDEX IF NOT EXISTS "auction_viewers_joinedAt_idx" ON "auction_viewers"("joinedAt");
CREATE INDEX IF NOT EXISTS "auction_viewers_userId_idx" ON "auction_viewers"("userId");

ALTER TABLE "auction_viewers" ADD CONSTRAINT "auction_viewers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "auction_viewers" ADD CONSTRAINT "auction_viewers_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Feature 8: Story-Feature
CREATE TABLE IF NOT EXISTS "stories" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "watchId" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stories_sellerId_idx" ON "stories"("sellerId");
CREATE INDEX IF NOT EXISTS "stories_expiresAt_idx" ON "stories"("expiresAt");
CREATE INDEX IF NOT EXISTS "stories_createdAt_idx" ON "stories"("createdAt");
CREATE INDEX IF NOT EXISTS "stories_watchId_idx" ON "stories"("watchId");

ALTER TABLE "stories" ADD CONSTRAINT "stories_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stories" ADD CONSTRAINT "stories_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Feature 9: Gamification
CREATE TABLE IF NOT EXISTS "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_badges_userId_badgeType_key" UNIQUE ("userId", "badgeType")
);

CREATE INDEX IF NOT EXISTS "user_badges_userId_idx" ON "user_badges"("userId");
CREATE INDEX IF NOT EXISTS "user_badges_badgeType_idx" ON "user_badges"("badgeType");

ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "user_streaks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastVisitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalVisits" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_streaks_userId_key" UNIQUE ("userId")
);

CREATE INDEX IF NOT EXISTS "user_streaks_userId_idx" ON "user_streaks"("userId");

ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "daily_deals" (
    "id" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_deals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "daily_deals_startDate_idx" ON "daily_deals"("startDate");
CREATE INDEX IF NOT EXISTS "daily_deals_endDate_idx" ON "daily_deals"("endDate");
CREATE INDEX IF NOT EXISTS "daily_deals_watchId_idx" ON "daily_deals"("watchId");

CREATE TABLE IF NOT EXISTS "rewards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardValue" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rewards_userId_idx" ON "rewards"("userId");
CREATE INDEX IF NOT EXISTS "rewards_expiresAt_idx" ON "rewards"("expiresAt");
CREATE INDEX IF NOT EXISTS "rewards_claimedAt_idx" ON "rewards"("claimedAt");

ALTER TABLE "rewards" ADD CONSTRAINT "rewards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Feature 10: AI-Powered Chat
CREATE TABLE IF NOT EXISTS "ai_conversations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messages" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_conversations_userId_idx" ON "ai_conversations"("userId");
CREATE INDEX IF NOT EXISTS "ai_conversations_createdAt_idx" ON "ai_conversations"("createdAt");

ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ai_search_results" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT,
    "watchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "productIds" TEXT NOT NULL DEFAULT '[]',
    "clickedProducts" TEXT DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_search_results_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ai_search_results_conversationId_idx" ON "ai_search_results"("conversationId");
CREATE INDEX IF NOT EXISTS "ai_search_results_watchId_idx" ON "ai_search_results"("watchId");
CREATE INDEX IF NOT EXISTS "ai_search_results_userId_idx" ON "ai_search_results"("userId");
CREATE INDEX IF NOT EXISTS "ai_search_results_createdAt_idx" ON "ai_search_results"("createdAt");

ALTER TABLE "ai_search_results" ADD CONSTRAINT "ai_search_results_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_search_results" ADD CONSTRAINT "ai_search_results_watchId_fkey" FOREIGN KEY ("watchId") REFERENCES "watches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_search_results" ADD CONSTRAINT "ai_search_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Feature 7: Video-Highlights - Nutzt bestehendes Watch.video Feld
-- Keine Migration nötig, Feld existiert bereits

-- Feature 3: Lokale Karte - Nutzt bestehende Watch.postalCode und Watch.city Felder
-- Keine Migration nötig, Felder existieren bereits
