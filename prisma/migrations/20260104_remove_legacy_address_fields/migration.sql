-- ============================================
-- Migration: Remove Legacy Address Fields
-- Phase 2 of User model refactoring
-- ============================================
-- IMPORTANT: Run this migration ONLY after verifying:
--   1. All address data has been migrated to user_addresses table
--   2. All code uses UserAddress model (not legacy fields)
--   3. You have a backup of the database
--
-- To verify migration completeness, run:
--   npx tsx scripts/migrate-user-addresses.ts --verify
-- ============================================

-- Step 1: Safety check - Ensure all addresses are migrated
-- This will fail if there are users with addresses not in user_addresses
DO $$
DECLARE
  unmigrated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO unmigrated_count
  FROM users u
  WHERE (u.street IS NOT NULL AND u.street != '' AND u.city IS NOT NULL AND u.city != '')
    AND NOT EXISTS (
      SELECT 1 FROM user_addresses ua 
      WHERE ua."userId" = u.id AND ua.type = 'MAIN'
    );
  
  IF unmigrated_count > 0 THEN
    RAISE EXCEPTION 'Migration blocked: % users have addresses not yet migrated to user_addresses table. Run: npx tsx scripts/migrate-user-addresses.ts', unmigrated_count;
  END IF;
END $$;

-- Step 2: Drop legacy MAIN address columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "street";
ALTER TABLE "users" DROP COLUMN IF EXISTS "streetNumber";
ALTER TABLE "users" DROP COLUMN IF EXISTS "postalCode";
ALTER TABLE "users" DROP COLUMN IF EXISTS "city";
ALTER TABLE "users" DROP COLUMN IF EXISTS "country";
ALTER TABLE "users" DROP COLUMN IF EXISTS "addresszusatz";
ALTER TABLE "users" DROP COLUMN IF EXISTS "kanton";

-- Step 3: Drop legacy DELIVERY address columns
ALTER TABLE "users" DROP COLUMN IF EXISTS "deliveryStreet";
ALTER TABLE "users" DROP COLUMN IF EXISTS "deliveryStreetNumber";
ALTER TABLE "users" DROP COLUMN IF EXISTS "deliveryPostalCode";
ALTER TABLE "users" DROP COLUMN IF EXISTS "deliveryCity";
ALTER TABLE "users" DROP COLUMN IF EXISTS "deliveryCountry";

-- Step 4: Drop legacy BILLING address columns (never used)
ALTER TABLE "users" DROP COLUMN IF EXISTS "billingStreet";
ALTER TABLE "users" DROP COLUMN IF EXISTS "billingStreetNumber";
ALTER TABLE "users" DROP COLUMN IF EXISTS "billingPostalCode";
ALTER TABLE "users" DROP COLUMN IF EXISTS "billingCity";
ALTER TABLE "users" DROP COLUMN IF EXISTS "billingCountry";
