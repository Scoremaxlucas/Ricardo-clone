-- CreateEnum
CREATE TYPE "RentalListingInviteStatus" AS ENUM ('SENT', 'URL_SUBMITTED', 'LISTING_CREATED', 'NEEDS_ADMIN');

-- CreateTable
CREATE TABLE "rental_listing_invites" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "RentalListingInviteStatus" NOT NULL DEFAULT 'SENT',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceUrl" TEXT,
    "urlSubmittedAt" TIMESTAMP(3),
    "draftPayload" JSONB,
    "lastError" TEXT,
    "rentalListingId" TEXT,

    CONSTRAINT "rental_listing_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rental_listing_invites_token_key" ON "rental_listing_invites"("token");

-- CreateIndex
CREATE INDEX "rental_listing_invites_createdByUserId_idx" ON "rental_listing_invites"("createdByUserId");

-- CreateIndex
CREATE INDEX "rental_listing_invites_email_idx" ON "rental_listing_invites"("email");

-- CreateIndex
CREATE INDEX "rental_listing_invites_status_idx" ON "rental_listing_invites"("status");

-- AddForeignKey
ALTER TABLE "rental_listing_invites" ADD CONSTRAINT "rental_listing_invites_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_listing_invites" ADD CONSTRAINT "rental_listing_invites_rentalListingId_fkey" FOREIGN KEY ("rentalListingId") REFERENCES "rental_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
