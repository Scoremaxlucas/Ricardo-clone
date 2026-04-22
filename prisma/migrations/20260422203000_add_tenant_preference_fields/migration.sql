-- Add optional tenant preference fields for Wohnen matching phase 1.
ALTER TABLE "tenant_profiles"
ADD COLUMN "preferredCanton" TEXT,
ADD COLUMN "preferredPostalCodes" TEXT,
ADD COLUMN "preferredBudgetMin" INTEGER,
ADD COLUMN "preferredBudgetMax" INTEGER,
ADD COLUMN "preferredMinRooms" DOUBLE PRECISION,
ADD COLUMN "preferredMaxRooms" DOUBLE PRECISION,
ADD COLUMN "preferredMoveInEarliest" TIMESTAMP(3),
ADD COLUMN "preferredMoveInLatest" TIMESTAMP(3);
