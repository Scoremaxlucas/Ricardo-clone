-- Add Connect Onboarding Status fields to User table
-- Just-in-Time Stripe Connect Onboarding for Helvenda Zahlungsschutz

-- Add connectOnboardingStatus field with default 'NOT_STARTED'
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "connectOnboardingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';

-- Add payoutsEnabled field with default false
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "payoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Update existing users who have completed Stripe onboarding
UPDATE "User" 
SET "connectOnboardingStatus" = 'COMPLETE',
    "payoutsEnabled" = true
WHERE "stripeOnboardingComplete" = true 
  AND "stripeConnectedAccountId" IS NOT NULL;

-- Update existing users who have started but not completed Stripe onboarding
UPDATE "User"
SET "connectOnboardingStatus" = 'INCOMPLETE'
WHERE "stripeConnectedAccountId" IS NOT NULL
  AND "stripeOnboardingComplete" = false;
