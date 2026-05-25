-- CreateEnum
CREATE TYPE "CurrentHousingSituation" AS ENUM ('RENTAL', 'OWNERSHIP', 'SUBLET', 'OTHER');

-- AlterTable
ALTER TABLE "tenant_profiles" ADD COLUMN "currentHousingSituation" "CurrentHousingSituation",
ADD COLUMN "currentHousingSince" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "helvenda_certificates" ADD COLUMN "verifiedHousingSituation" "CurrentHousingSituation",
ADD COLUMN "verifiedHousingSince" TIMESTAMP(3);
