-- CreateTable
CREATE TABLE IF NOT EXISTS "draft_images" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "draft_images_storageKey_key" ON "draft_images"("storageKey");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "draft_images_draftId_idx" ON "draft_images"("draftId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "draft_images_draftId_sortOrder_idx" ON "draft_images"("draftId", "sortOrder");

-- AddForeignKey
ALTER TABLE "draft_images" ADD CONSTRAINT "draft_images_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add coverImageId to drafts
ALTER TABLE "drafts" ADD COLUMN IF NOT EXISTS "coverImageId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "drafts_coverImageId_idx" ON "drafts"("coverImageId");

