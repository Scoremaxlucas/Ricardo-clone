-- Refines tenant income enum buckets for clearer, more realistic ranges.
CREATE TYPE "IncomeCategory_new" AS ENUM (
  'UNDER_3000',
  'FROM_3000_TO_4000',
  'FROM_4000_TO_5500',
  'FROM_5500_TO_7000',
  'FROM_7000_TO_9000',
  'ABOVE_9000'
);

ALTER TABLE "tenant_profiles"
ALTER COLUMN "monthlyIncomeCategory" TYPE "IncomeCategory_new"
USING (
  CASE "monthlyIncomeCategory"::text
    WHEN 'UNDER_2000' THEN 'UNDER_3000'
    WHEN 'FROM_2000_TO_3000' THEN 'FROM_3000_TO_4000'
    WHEN 'FROM_3000_TO_4000' THEN 'FROM_4000_TO_5500'
    WHEN 'FROM_4000_TO_5000' THEN 'FROM_5500_TO_7000'
    WHEN 'FROM_5000_TO_7000' THEN 'FROM_7000_TO_9000'
    WHEN 'ABOVE_7000' THEN 'ABOVE_9000'
    ELSE 'FROM_4000_TO_5500'
  END
)::"IncomeCategory_new";

ALTER TYPE "IncomeCategory" RENAME TO "IncomeCategory_old";
ALTER TYPE "IncomeCategory_new" RENAME TO "IncomeCategory";
DROP TYPE "IncomeCategory_old";
