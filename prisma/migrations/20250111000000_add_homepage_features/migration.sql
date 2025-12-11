-- Migration: Add Homepage Enhancement Features
-- Phase 0: Foundation - All database tables for 10 homepage features
-- Created: 2025-01-11
-- Adapted for SQLite

-- Feature 1: Intelligente Suche - Search Analytics
CREATE TABLE IF NOT EXISTS "search_queries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "clicked" INTEGER NOT NULL DEFAULT 0,
    "clickedWatchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "search_queries_query_idx" ON "search_queries"("query");
CREATE INDEX IF NOT EXISTS "search_queries_createdAt_idx" ON "search_queries"("createdAt");
CREATE INDEX IF NOT EXISTS "search_queries_userId_idx" ON "search_queries"("userId");
CREATE INDEX IF NOT EXISTS "search_queries_category_idx" ON "search_queries"("category");

-- Feature 2: Social Proof - Product Statistics
CREATE TABLE IF NOT EXISTS "product_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "watchId" TEXT NOT NULL UNIQUE,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "soldLast24h" INTEGER NOT NULL DEFAULT 0,
    "viewersNow" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "product_stats_watchId_idx" ON "product_stats"("watchId");
CREATE INDEX IF NOT EXISTS "product_stats_lastUpdated_idx" ON "product_stats"("lastUpdated");

-- Feature 4: Smart Collections
CREATE TABLE IF NOT EXISTS "collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'user',
    "userId" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "collections_userId_idx" ON "collections"("userId");
CREATE INDEX IF NOT EXISTS "collections_type_idx" ON "collections"("type");
CREATE INDEX IF NOT EXISTS "collections_createdAt_idx" ON "collections"("createdAt");

CREATE TABLE IF NOT EXISTS "collection_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "collectionId" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("collectionId", "watchId")
);

CREATE INDEX IF NOT EXISTS "collection_items_collectionId_idx" ON "collection_items"("collectionId");
CREATE INDEX IF NOT EXISTS "collection_items_watchId_idx" ON "collection_items"("watchId");
CREATE INDEX IF NOT EXISTS "collection_items_order_idx" ON "collection_items"("order");

-- Feature 5: Personalisierung
CREATE TABLE IF NOT EXISTS "browsing_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "viewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER DEFAULT 0,
    "action" TEXT NOT NULL DEFAULT 'view'
);

CREATE INDEX IF NOT EXISTS "browsing_history_userId_idx" ON "browsing_history"("userId");
CREATE INDEX IF NOT EXISTS "browsing_history_userId_viewedAt_idx" ON "browsing_history"("userId", "viewedAt");
CREATE INDEX IF NOT EXISTS "browsing_history_watchId_idx" ON "browsing_history"("watchId");
CREATE INDEX IF NOT EXISTS "browsing_history_action_idx" ON "browsing_history"("action");

CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "preferredCategories" TEXT,
    "priceRange" TEXT,
    "preferredBrands" TEXT,
    "preferredConditions" TEXT,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "user_preferences_userId_idx" ON "user_preferences"("userId");

-- Feature 6: Live-Auktionen
CREATE TABLE IF NOT EXISTS "auction_viewers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "watchId" TEXT NOT NULL,
    "userId" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "auction_viewers_watchId_idx" ON "auction_viewers"("watchId");
CREATE INDEX IF NOT EXISTS "auction_viewers_joinedAt_idx" ON "auction_viewers"("joinedAt");
CREATE INDEX IF NOT EXISTS "auction_viewers_userId_idx" ON "auction_viewers"("userId");

-- Feature 8: Story-Feature
CREATE TABLE IF NOT EXISTS "stories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "watchId" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "text" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

CREATE INDEX IF NOT EXISTS "stories_sellerId_idx" ON "stories"("sellerId");
CREATE INDEX IF NOT EXISTS "stories_expiresAt_idx" ON "stories"("expiresAt");
CREATE INDEX IF NOT EXISTS "stories_createdAt_idx" ON "stories"("createdAt");
CREATE INDEX IF NOT EXISTS "stories_watchId_idx" ON "stories"("watchId");

-- Feature 9: Gamification
CREATE TABLE IF NOT EXISTS "user_badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "earnedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "badgeType")
);

CREATE INDEX IF NOT EXISTS "user_badges_userId_idx" ON "user_badges"("userId");
CREATE INDEX IF NOT EXISTS "user_badges_badgeType_idx" ON "user_badges"("badgeType");

CREATE TABLE IF NOT EXISTS "user_streaks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastVisitDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalVisits" INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "user_streaks_userId_idx" ON "user_streaks"("userId");

CREATE TABLE IF NOT EXISTS "daily_deals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "watchId" TEXT NOT NULL,
    "discountPercent" REAL NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "maxQuantity" INTEGER NOT NULL DEFAULT 1,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "daily_deals_startDate_idx" ON "daily_deals"("startDate");
CREATE INDEX IF NOT EXISTS "daily_deals_endDate_idx" ON "daily_deals"("endDate");
CREATE INDEX IF NOT EXISTS "daily_deals_watchId_idx" ON "daily_deals"("watchId");

CREATE TABLE IF NOT EXISTS "rewards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "rewardValue" TEXT NOT NULL,
    "claimedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME
);

CREATE INDEX IF NOT EXISTS "rewards_userId_idx" ON "rewards"("userId");
CREATE INDEX IF NOT EXISTS "rewards_expiresAt_idx" ON "rewards"("expiresAt");
CREATE INDEX IF NOT EXISTS "rewards_claimedAt_idx" ON "rewards"("claimedAt");

-- Feature 10: AI-Powered Chat
CREATE TABLE IF NOT EXISTS "ai_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "messages" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ai_conversations_userId_idx" ON "ai_conversations"("userId");
CREATE INDEX IF NOT EXISTS "ai_conversations_createdAt_idx" ON "ai_conversations"("createdAt");

CREATE TABLE IF NOT EXISTS "ai_search_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT,
    "watchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "productIds" TEXT NOT NULL DEFAULT '[]',
    "clickedProducts" TEXT DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ai_search_results_conversationId_idx" ON "ai_search_results"("conversationId");
CREATE INDEX IF NOT EXISTS "ai_search_results_watchId_idx" ON "ai_search_results"("watchId");
CREATE INDEX IF NOT EXISTS "ai_search_results_userId_idx" ON "ai_search_results"("userId");
CREATE INDEX IF NOT EXISTS "ai_search_results_createdAt_idx" ON "ai_search_results"("createdAt");

-- Feature 7: Video-Highlights - Nutzt bestehendes Watch.video Feld
-- Keine Migration nötig, Feld existiert bereits

-- Feature 3: Lokale Karte - Nutzt bestehende Watch.postalCode und Watch.city Felder
-- Keine Migration nötig, Felder existieren bereits
