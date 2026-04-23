-- Extend income bands; map legacy ABOVE_9000 → FROM_9000_TO_12000
CREATE TYPE "IncomeCategory_new" AS ENUM (
  'UNDER_3000',
  'FROM_3000_TO_4000',
  'FROM_4000_TO_5500',
  'FROM_5500_TO_7000',
  'FROM_7000_TO_9000',
  'FROM_9000_TO_12000',
  'FROM_12000_TO_16000',
  'FROM_16000_TO_22000',
  'ABOVE_22000'
);

ALTER TABLE "tenant_profiles"
ALTER COLUMN "monthlyIncomeCategory" TYPE "IncomeCategory_new"
USING (
  CASE "monthlyIncomeCategory"::text
    WHEN 'ABOVE_9000' THEN 'FROM_9000_TO_12000'
    ELSE "monthlyIncomeCategory"::text
  END
)::"IncomeCategory_new";

ALTER TYPE "IncomeCategory" RENAME TO "IncomeCategory_old";
ALTER TYPE "IncomeCategory_new" RENAME TO "IncomeCategory";
DROP TYPE "IncomeCategory_old";

-- Haustiere + freiwillige Nichtraucher-Angabe
CREATE TYPE "HouseholdPets" AS ENUM ('UNSPECIFIED', 'NONE', 'HAS_PETS');

ALTER TABLE "tenant_profiles" ADD COLUMN "declaresNonSmoker" BOOLEAN;
ALTER TABLE "tenant_profiles" ADD COLUMN "householdPets" "HouseholdPets" NOT NULL DEFAULT 'UNSPECIFIED';
