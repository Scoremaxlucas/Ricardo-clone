-- ============================================
-- Migration: Add UserAddress Table
-- Phase 1 of User model refactoring
-- ============================================
-- This migration:
-- 1. Creates the user_addresses table
-- 2. Migrates existing address data from users table
-- 3. Keeps old columns intact for backward compatibility
--
-- IMPORTANT: Old columns (street, city, etc.) are NOT removed.
-- They will be removed in a future migration after all code
-- has been updated to use the new UserAddress table.
-- ============================================

-- Step 1: Create the user_addresses table
CREATE TABLE IF NOT EXISTS "user_addresses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "streetNumber" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Schweiz',
    "addresszusatz" TEXT,
    "kanton" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS "user_addresses_userId_idx" ON "user_addresses"("userId");
CREATE INDEX IF NOT EXISTS "user_addresses_type_idx" ON "user_addresses"("type");

-- Step 3: Create unique constraint (one address per type per user)
CREATE UNIQUE INDEX IF NOT EXISTS "user_addresses_userId_type_key" ON "user_addresses"("userId", "type");

-- Step 4: Add foreign key constraint
ALTER TABLE "user_addresses" 
ADD CONSTRAINT "user_addresses_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Migrate existing MAIN addresses from users table
-- Only migrate if street AND city are not null
INSERT INTO "user_addresses" ("id", "userId", "type", "street", "streetNumber", "postalCode", "city", "country", "addresszusatz", "kanton", "isDefault", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id",
    'MAIN',
    COALESCE("street", ''),
    COALESCE("streetNumber", ''),
    COALESCE("postalCode", ''),
    COALESCE("city", ''),
    COALESCE("country", 'Schweiz'),
    "addresszusatz",
    "kanton",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users"
WHERE "street" IS NOT NULL 
  AND "street" != ''
  AND "city" IS NOT NULL 
  AND "city" != ''
ON CONFLICT ("userId", "type") DO NOTHING;

-- Step 6: Migrate existing DELIVERY addresses from users table
-- Only migrate if deliveryStreet AND deliveryCity are not null
INSERT INTO "user_addresses" ("id", "userId", "type", "street", "streetNumber", "postalCode", "city", "country", "addresszusatz", "kanton", "isDefault", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id",
    'DELIVERY',
    COALESCE("deliveryStreet", ''),
    COALESCE("deliveryStreetNumber", ''),
    COALESCE("deliveryPostalCode", ''),
    COALESCE("deliveryCity", ''),
    COALESCE("deliveryCountry", 'Schweiz'),
    NULL, -- no addresszusatz for delivery
    NULL, -- no kanton for delivery
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "users"
WHERE "deliveryStreet" IS NOT NULL 
  AND "deliveryStreet" != ''
  AND "deliveryCity" IS NOT NULL 
  AND "deliveryCity" != ''
ON CONFLICT ("userId", "type") DO NOTHING;

-- ============================================
-- NOTE: The following columns on the users table 
-- are NOT removed in this migration for safety:
--
-- Main address:
--   - street, streetNumber, postalCode, city, country
--   - addresszusatz, kanton
--
-- Delivery address:
--   - deliveryStreet, deliveryStreetNumber
--   - deliveryPostalCode, deliveryCity, deliveryCountry
--
-- Billing address (never used):
--   - billingStreet, billingStreetNumber
--   - billingPostalCode, billingCity, billingCountry
--
-- These columns will be removed in Phase 2 after
-- all code has been updated to use UserAddress.
-- ============================================
