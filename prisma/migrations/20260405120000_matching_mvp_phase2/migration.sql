-- Helvenda Matching MVP (Phase 2): idempotent für Retries (z. B. nach P3018 / teilweise angelegte ENUMs)

DO $$ BEGIN CREATE TYPE "LandlordMembershipRole" AS ENUM ('owner', 'admin', 'member'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MatchPropertySource" AS ENUM ('manual', 'csv', 'api'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MatchPropertyStatus" AS ENUM ('draft', 'active', 'paused', 'archived'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "HousingMatchStatus" AS ENUM ('active', 'stale', 'hidden', 'hard_rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MatchingApplicationStatus" AS ENUM (
  'draft', 'submitted', 'withdrawn', 'landlord_reviewing', 'landlord_accepted', 'landlord_rejected', 'closed'
); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MatchingDocumentSubject" AS ENUM ('seeker_profile', 'property', 'matching_application'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MatchingDocumentKind" AS ENUM ('id_proof', 'income', 'other'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MatchingDocumentStatus" AS ENUM ('pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "DocumentVerificationStatus" AS ENUM ('pending', 'approved', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "MatchingOutboxStatus" AS ENUM ('pending', 'processing', 'completed', 'failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "matching_landlord_accounts" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "displayName" TEXT,
    CONSTRAINT "matching_landlord_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_landlord_memberships" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "landlordAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "LandlordMembershipRole" NOT NULL DEFAULT 'member',
    CONSTRAINT "matching_landlord_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_properties" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "landlordAccountId" TEXT NOT NULL,
    "source" "MatchPropertySource" NOT NULL DEFAULT 'manual',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "addressLine" TEXT,
    "zip" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "canton" TEXT NOT NULL,
    "rooms" DECIMAL(4, 1) NOT NULL,
    "areaSqm" INTEGER,
    "floor" INTEGER,
    "rentPerMonth" INTEGER NOT NULL,
    "availableFrom" TIMESTAMP(3),
    "availableTo" TIMESTAMP(3),
    "petPolicyNote" TEXT,
    "rulesJson" JSONB,
    "status" "MatchPropertyStatus" NOT NULL DEFAULT 'draft',
    CONSTRAINT "matching_properties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_seeker_profiles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "matching_seeker_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_seeker_search_profiles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "cantonPreference" TEXT,
    "postalCodesWanted" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "minRooms" DECIMAL(4, 1),
    "maxRooms" DECIMAL(4, 1),
    "moveInEarliest" TIMESTAMP(3),
    "moveInLatest" TIMESTAMP(3),
    CONSTRAINT "matching_seeker_search_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_household_profiles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "petsDescription" TEXT,
    CONSTRAINT "matching_household_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_employment_profiles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "employmentStatus" TEXT,
    "employerName" TEXT,
    CONSTRAINT "matching_employment_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_financial_profiles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "monthlyNetIncomeBand" TEXT,
    CONSTRAINT "matching_financial_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_housing_history_entries" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seekerProfileId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "label" TEXT,
    "notes" TEXT,
    CONSTRAINT "matching_housing_history_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_documents" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subjectType" "MatchingDocumentSubject" NOT NULL,
    "subjectId" TEXT NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "kind" "MatchingDocumentKind" NOT NULL DEFAULT 'other',
    "status" "MatchingDocumentStatus" NOT NULL DEFAULT 'pending',
    CONSTRAINT "matching_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_document_verifications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentId" TEXT NOT NULL,
    "verifiedByUserId" TEXT,
    "status" "DocumentVerificationStatus" NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    CONSTRAINT "matching_document_verifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_matches" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hardFailed" BOOLEAN NOT NULL DEFAULT false,
    "status" "HousingMatchStatus" NOT NULL DEFAULT 'active',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matching_matches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_match_reasons" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "matchId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "detail" TEXT,
    CONSTRAINT "matching_match_reasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_applications" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,
    "seekerProfileId" TEXT NOT NULL,
    "housingMatchId" TEXT,
    "status" "MatchingApplicationStatus" NOT NULL DEFAULT 'draft',
    "message" TEXT,
    CONSTRAINT "matching_applications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_consent_shares" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "matching_consent_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_audit_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    CONSTRAINT "matching_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "matching_outbox_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "MatchingOutboxStatus" NOT NULL DEFAULT 'pending',
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    CONSTRAINT "matching_outbox_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "matching_landlord_memberships_landlordAccountId_userId_key" ON "matching_landlord_memberships"("landlordAccountId", "userId");
CREATE INDEX IF NOT EXISTS "matching_landlord_memberships_userId_idx" ON "matching_landlord_memberships"("userId");
CREATE INDEX IF NOT EXISTS "matching_properties_landlordAccountId_status_idx" ON "matching_properties"("landlordAccountId", "status");
CREATE INDEX IF NOT EXISTS "matching_properties_canton_zip_idx" ON "matching_properties"("canton", "zip");
CREATE INDEX IF NOT EXISTS "matching_properties_status_rentPerMonth_idx" ON "matching_properties"("status", "rentPerMonth");
CREATE UNIQUE INDEX IF NOT EXISTS "matching_seeker_profiles_userId_key" ON "matching_seeker_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "matching_seeker_search_profiles_seekerProfileId_key" ON "matching_seeker_search_profiles"("seekerProfileId");
CREATE INDEX IF NOT EXISTS "matching_seeker_search_profiles_cantonPreference_idx" ON "matching_seeker_search_profiles"("cantonPreference");
CREATE UNIQUE INDEX IF NOT EXISTS "matching_household_profiles_seekerProfileId_key" ON "matching_household_profiles"("seekerProfileId");
CREATE UNIQUE INDEX IF NOT EXISTS "matching_employment_profiles_seekerProfileId_key" ON "matching_employment_profiles"("seekerProfileId");
CREATE UNIQUE INDEX IF NOT EXISTS "matching_financial_profiles_seekerProfileId_key" ON "matching_financial_profiles"("seekerProfileId");
CREATE INDEX IF NOT EXISTS "matching_housing_history_entries_seekerProfileId_idx" ON "matching_housing_history_entries"("seekerProfileId");
CREATE INDEX IF NOT EXISTS "matching_documents_subjectType_subjectId_idx" ON "matching_documents"("subjectType", "subjectId");
CREATE INDEX IF NOT EXISTS "matching_documents_uploadedByUserId_idx" ON "matching_documents"("uploadedByUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "matching_document_verifications_documentId_key" ON "matching_document_verifications"("documentId");
CREATE INDEX IF NOT EXISTS "matching_document_verifications_status_idx" ON "matching_document_verifications"("status");
CREATE INDEX IF NOT EXISTS "matching_matches_seekerProfileId_status_computedAt_idx" ON "matching_matches"("seekerProfileId", "status", "computedAt");
CREATE INDEX IF NOT EXISTS "matching_matches_propertyId_status_score_idx" ON "matching_matches"("propertyId", "status", "score");
CREATE UNIQUE INDEX IF NOT EXISTS "matching_matches_seekerProfileId_propertyId_key" ON "matching_matches"("seekerProfileId", "propertyId");
CREATE INDEX IF NOT EXISTS "matching_match_reasons_matchId_idx" ON "matching_match_reasons"("matchId");
CREATE UNIQUE INDEX IF NOT EXISTS "matching_applications_housingMatchId_key" ON "matching_applications"("housingMatchId");
CREATE INDEX IF NOT EXISTS "matching_applications_propertyId_status_idx" ON "matching_applications"("propertyId", "status");
CREATE INDEX IF NOT EXISTS "matching_applications_seekerProfileId_status_idx" ON "matching_applications"("seekerProfileId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "matching_consent_shares_applicationId_scope_key" ON "matching_consent_shares"("applicationId", "scope");
CREATE INDEX IF NOT EXISTS "matching_consent_shares_applicationId_idx" ON "matching_consent_shares"("applicationId");
CREATE INDEX IF NOT EXISTS "matching_audit_logs_entityType_entityId_idx" ON "matching_audit_logs"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "matching_audit_logs_actorUserId_createdAt_idx" ON "matching_audit_logs"("actorUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "matching_outbox_events_status_createdAt_idx" ON "matching_outbox_events"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "matching_outbox_events_type_idx" ON "matching_outbox_events"("type");

DO $$ BEGIN
  ALTER TABLE "matching_landlord_memberships" ADD CONSTRAINT "matching_landlord_memberships_landlordAccountId_fkey"
    FOREIGN KEY ("landlordAccountId") REFERENCES "matching_landlord_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_landlord_memberships" ADD CONSTRAINT "matching_landlord_memberships_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_properties" ADD CONSTRAINT "matching_properties_landlordAccountId_fkey"
    FOREIGN KEY ("landlordAccountId") REFERENCES "matching_landlord_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_seeker_profiles" ADD CONSTRAINT "matching_seeker_profiles_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_seeker_search_profiles" ADD CONSTRAINT "matching_seeker_search_profiles_seekerProfileId_fkey"
    FOREIGN KEY ("seekerProfileId") REFERENCES "matching_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_household_profiles" ADD CONSTRAINT "matching_household_profiles_seekerProfileId_fkey"
    FOREIGN KEY ("seekerProfileId") REFERENCES "matching_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_employment_profiles" ADD CONSTRAINT "matching_employment_profiles_seekerProfileId_fkey"
    FOREIGN KEY ("seekerProfileId") REFERENCES "matching_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_financial_profiles" ADD CONSTRAINT "matching_financial_profiles_seekerProfileId_fkey"
    FOREIGN KEY ("seekerProfileId") REFERENCES "matching_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_housing_history_entries" ADD CONSTRAINT "matching_housing_history_entries_seekerProfileId_fkey"
    FOREIGN KEY ("seekerProfileId") REFERENCES "matching_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_documents" ADD CONSTRAINT "matching_documents_uploadedByUserId_fkey"
    FOREIGN KEY ("uploadedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_document_verifications" ADD CONSTRAINT "matching_document_verifications_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "matching_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_document_verifications" ADD CONSTRAINT "matching_document_verifications_verifiedByUserId_fkey"
    FOREIGN KEY ("verifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_matches" ADD CONSTRAINT "matching_matches_seekerProfileId_fkey"
    FOREIGN KEY ("seekerProfileId") REFERENCES "matching_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_matches" ADD CONSTRAINT "matching_matches_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "matching_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_match_reasons" ADD CONSTRAINT "matching_match_reasons_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "matching_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_applications" ADD CONSTRAINT "matching_applications_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "matching_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_applications" ADD CONSTRAINT "matching_applications_seekerProfileId_fkey"
    FOREIGN KEY ("seekerProfileId") REFERENCES "matching_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_applications" ADD CONSTRAINT "matching_applications_housingMatchId_fkey"
    FOREIGN KEY ("housingMatchId") REFERENCES "matching_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_consent_shares" ADD CONSTRAINT "matching_consent_shares_applicationId_fkey"
    FOREIGN KEY ("applicationId") REFERENCES "matching_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "matching_audit_logs" ADD CONSTRAINT "matching_audit_logs_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
