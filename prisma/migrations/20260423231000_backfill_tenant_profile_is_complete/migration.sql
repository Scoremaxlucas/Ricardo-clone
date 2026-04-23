-- Mieterprofile mit realen Stammdaten, die fälschlich isComplete = false hatten (z. B. nur per PATCH aktualisiert).
UPDATE "tenant_profiles"
SET "isComplete" = true
WHERE "isComplete" = false
  AND length(trim("firstName")) > 0
  AND length(trim("lastName")) > 0
  AND "dateOfBirth" IS NOT NULL
  AND length(trim(coalesce("contactPhone", ''))) >= 10;
