-- CRITICAL: Restore Users SQL Script
-- Run this in Neon/Vercel SQL Editor when database quota is available
-- Or wait for quota reset and run: npx tsx scripts/restore-all-data.ts

-- Note: Passwords are bcrypt hashed. Use the restore script for proper password hashing.
-- This SQL script creates users but you'll need to set passwords via the restore script.

-- 1. Ensure admin user exists
INSERT INTO users (id, email, name, "isAdmin", "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin@helvenda.ch',
  'Admin',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "isAdmin" = true,
  "emailVerified" = true,
  "isBlocked" = false,
  "blockedAt" = NULL,
  "blockedReason" = NULL;

-- 2. Ensure Noah user exists
INSERT INTO users (id, email, name, "firstName", "lastName", nickname, "emailVerified", verified, "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'noah@test.com',
  'Noah',
  'Noah',
  'Gafner',
  'Noah',
  true,
  true,
  'approved',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "emailVerified" = true,
  verified = true,
  "verificationStatus" = 'approved',
  "isBlocked" = false,
  "blockedAt" = NULL,
  "blockedReason" = NULL;

-- 3. Ensure Gregor user exists
INSERT INTO users (id, email, name, "firstName", "lastName", nickname, "emailVerified", verified, "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'gregor@test.com',
  'Gregor',
  'Gregor',
  'Müller',
  'Gregor',
  true,
  true,
  'approved',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "emailVerified" = true,
  verified = true,
  "verificationStatus" = 'approved',
  "isBlocked" = false,
  "blockedAt" = NULL,
  "blockedReason" = NULL;

-- 4. Ensure Lucas8122 user exists
INSERT INTO users (id, email, name, "firstName", "lastName", nickname, "emailVerified", verified, "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'Lugas8122@gmail.com',
  'Lucas',
  'Lucas',
  'Rodrigues',
  'Lucas8122',
  true,
  true,
  'approved',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "emailVerified" = true,
  verified = true,
  "verificationStatus" = 'approved',
  "isBlocked" = false,
  "blockedAt" = NULL,
  "blockedReason" = NULL;

-- 5. Ensure Lucas8118 user exists
INSERT INTO users (id, email, name, "firstName", "lastName", nickname, "emailVerified", verified, "verificationStatus", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'Lolcas8118@gmail.com',
  'Lucas',
  'Lucas',
  'Rodrigues',
  'Lucas8118',
  true,
  true,
  'approved',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "emailVerified" = true,
  verified = true,
  "verificationStatus" = 'approved',
  "isBlocked" = false,
  "blockedAt" = NULL,
  "blockedReason" = NULL;

-- IMPORTANT: After running this SQL, you MUST run the restore script to set passwords:
-- npx tsx scripts/restore-all-data.ts
-- 
-- The SQL only creates/updates users, but passwords need to be bcrypt hashed properly.

