-- AlterTable: Add lastBidAt to Watch
ALTER TABLE "watches" ADD COLUMN "lastBidAt" DATETIME;

-- AlterTable: Add contact deadline fields to Purchase
ALTER TABLE "purchases" ADD COLUMN "contactDeadline" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "purchases" ADD COLUMN "sellerContactedAt" DATETIME;
ALTER TABLE "purchases" ADD COLUMN "buyerContactedAt" DATETIME;
ALTER TABLE "purchases" ADD COLUMN "contactWarningSentAt" DATETIME;
ALTER TABLE "purchases" ADD COLUMN "contactDeadlineMissed" BOOLEAN NOT NULL DEFAULT 0;

-- Update existing purchases: Set contactDeadline to 7 days after createdAt
UPDATE "purchases" SET "contactDeadline" = datetime("createdAt", '+7 days') WHERE "contactDeadline" IS NULL OR "contactDeadline" = "createdAt";







