-- Erweiterte Einkommenskategorien (neue Enum-Werte; bestehende Daten unverändert).
ALTER TYPE "IncomeCategory" ADD VALUE 'UNDER_2000';
ALTER TYPE "IncomeCategory" ADD VALUE 'FROM_2000_TO_3000';
ALTER TYPE "IncomeCategory" ADD VALUE 'FROM_4000_TO_5000';
ALTER TYPE "IncomeCategory" ADD VALUE 'FROM_5000_TO_7000';
ALTER TYPE "IncomeCategory" ADD VALUE 'FROM_12000_TO_15000';
ALTER TYPE "IncomeCategory" ADD VALUE 'FROM_15000_TO_20000';
ALTER TYPE "IncomeCategory" ADD VALUE 'FROM_20000_TO_30000';
ALTER TYPE "IncomeCategory" ADD VALUE 'FROM_30000_TO_50000';
ALTER TYPE "IncomeCategory" ADD VALUE 'ABOVE_50000';
