-- Haushaltsgrösse / Kinder; Haustiere-Default auf NONE
ALTER TABLE "tenant_profiles" ADD COLUMN "householdTotalPersons" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "tenant_profiles" ADD COLUMN "householdChildrenCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "tenant_profiles" SET "householdPets" = 'NONE' WHERE "householdPets" = 'UNSPECIFIED';

ALTER TABLE "tenant_profiles" ALTER COLUMN "householdPets" SET DEFAULT 'NONE';
