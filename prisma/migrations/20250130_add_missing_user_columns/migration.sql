-- Add missing columns to users table that were in schema but not in database

-- chargesEnabled - Stripe charges enabled flag
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "chargesEnabled" BOOLEAN DEFAULT false;

-- stripeRequirements - JSON snapshot of Stripe requirements for UI
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeRequirements" JSONB;
