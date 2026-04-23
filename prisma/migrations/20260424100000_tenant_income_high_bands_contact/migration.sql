-- Split top income band; map ABOVE_22000 → FROM_22000_TO_30000
CREATE TYPE "IncomeCategory_new" AS ENUM (
  'UNDER_3000',
  'FROM_3000_TO_4000',
  'FROM_4000_TO_5500',
  'FROM_5500_TO_7000',
  'FROM_7000_TO_9000',
  'FROM_9000_TO_12000',
  'FROM_12000_TO_16000',
  'FROM_16000_TO_22000',
  'FROM_22000_TO_30000',
  'FROM_30000_TO_45000',
  'FROM_45000_TO_65000',
  'FROM_65000_TO_90000',
  'ABOVE_90000'
);

ALTER TABLE "tenant_profiles"
ALTER COLUMN "monthlyIncomeCategory" TYPE "IncomeCategory_new"
USING (
  CASE "monthlyIncomeCategory"::text
    WHEN 'ABOVE_22000' THEN 'FROM_22000_TO_30000'
    ELSE "monthlyIncomeCategory"::text
  END
)::"IncomeCategory_new";

ALTER TYPE "IncomeCategory" RENAME TO "IncomeCategory_old";
ALTER TYPE "IncomeCategory_new" RENAME TO "IncomeCategory";
DROP TYPE "IncomeCategory_old";

-- Telefon (Bewerbungsprofil) + optionale Kontakt-E-Mail
ALTER TABLE "tenant_profiles" ADD COLUMN "contactPhone" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tenant_profiles" ADD COLUMN "applicationEmail" TEXT;

UPDATE "tenant_profiles" tp
SET "contactPhone" = TRIM(u.phone)
FROM "users" u
WHERE u.id = tp."userId"
  AND u.phone IS NOT NULL
  AND TRIM(u.phone) <> ''
  AND TRIM(COALESCE(tp."contactPhone", '')) = '';
