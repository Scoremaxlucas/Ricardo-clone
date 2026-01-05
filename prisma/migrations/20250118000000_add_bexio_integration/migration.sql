-- Migration: Add Bexio Integration and Unique QR References
-- This enables automatic payment matching via QR-Bill references

-- Add Bexio contact ID to User for syncing customers
ALTER TABLE "User" ADD COLUMN "bexioContactId" INTEGER;

-- Add unique QR reference and Bexio invoice ID to Invoice
ALTER TABLE "Invoice" ADD COLUMN "qrReference" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "bexioInvoiceId" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN "paymentMatchedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "paymentMatchedAmount" DECIMAL(10,2);

-- Create unique index on qrReference for fast lookup during payment matching
CREATE UNIQUE INDEX "Invoice_qrReference_key" ON "Invoice"("qrReference");

-- Create index on bexioInvoiceId for sync operations
CREATE INDEX "Invoice_bexioInvoiceId_idx" ON "Invoice"("bexioInvoiceId");

-- Create index on bexioContactId for user lookups
CREATE INDEX "User_bexioContactId_idx" ON "User"("bexioContactId");
