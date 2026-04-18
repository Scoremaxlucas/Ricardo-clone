-- Helvenda Wohnen Phase 3: Mieterprofil + Betreibungsregister-Status

CREATE TYPE "EmploymentStatus" AS ENUM (
  'EMPLOYED',
  'SELF_EMPLOYED',
  'STUDENT',
  'RETIRED',
  'UNEMPLOYED',
  'OTHER'
);

CREATE TYPE "IncomeCategory" AS ENUM (
  'UNDER_2000',
  'FROM_2000_TO_3000',
  'FROM_3000_TO_4000',
  'FROM_4000_TO_5000',
  'FROM_5000_TO_7000',
  'ABOVE_7000'
);

CREATE TYPE "CreditCheckStatus" AS ENUM (
  'NONE',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
  'PENDING_MANUAL_REVIEW'
);

CREATE TABLE "tenant_profiles" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "currentAddress" TEXT NOT NULL,
    "currentZip" TEXT NOT NULL,
    "currentCity" TEXT NOT NULL,
    "employmentStatus" "EmploymentStatus" NOT NULL,
    "employer" TEXT,
    "jobTitle" TEXT,
    "employedSince" TIMESTAMP(3),
    "monthlyIncomeCategory" "IncomeCategory" NOT NULL,
    "referenceName" TEXT,
    "referencePhone" TEXT,
    "referenceRelation" TEXT,
    "creditCheckStatus" "CreditCheckStatus" NOT NULL DEFAULT 'NONE',
    "creditCheckResult" JSONB,
    "encryptedFileRef" TEXT,
    "creditCheckUploadedAt" TIMESTAMP(3),
    "creditCheckExpiresAt" TIMESTAMP(3),
    "isComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tenant_profiles_userId_key" ON "tenant_profiles"("userId");

CREATE INDEX "tenant_profiles_userId_idx" ON "tenant_profiles"("userId");

ALTER TABLE "tenant_profiles"
ADD CONSTRAINT "tenant_profiles_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
