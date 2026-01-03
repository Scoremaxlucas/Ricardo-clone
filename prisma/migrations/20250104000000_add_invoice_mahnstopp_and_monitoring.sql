-- Add Mahnstopp (Collection Stop) fields to invoices
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionStopped" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionStoppedAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionStoppedBy" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionStoppedReason" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "collectionResumedAt" TIMESTAMP(3);

-- Add Admin notes
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;

-- Add Payment arrangement fields
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentArrangement" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentArrangementDate" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentArrangementNotes" TEXT;

-- Create RateLimit table for rate limiting
CREATE TABLE IF NOT EXISTS "rate_limits" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- Create index for rate_limits
CREATE INDEX IF NOT EXISTS "rate_limits_identifier_createdAt_idx" ON "rate_limits"("identifier", "createdAt");
CREATE INDEX IF NOT EXISTS "rate_limits_createdAt_idx" ON "rate_limits"("createdAt");

-- Create WebhookMetric table for monitoring
CREATE TABLE IF NOT EXISTS "webhook_metrics" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "processingTimeMs" INTEGER NOT NULL,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_metrics_pkey" PRIMARY KEY ("id")
);

-- Create indexes for webhook_metrics
CREATE INDEX IF NOT EXISTS "webhook_metrics_timestamp_idx" ON "webhook_metrics"("timestamp");
CREATE INDEX IF NOT EXISTS "webhook_metrics_eventType_timestamp_idx" ON "webhook_metrics"("eventType", "timestamp");
CREATE INDEX IF NOT EXISTS "webhook_metrics_success_timestamp_idx" ON "webhook_metrics"("success", "timestamp");

-- Create AlertLog table for alert tracking
CREATE TABLE IF NOT EXISTS "alert_logs" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "details" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_logs_pkey" PRIMARY KEY ("id")
);

-- Create indexes for alert_logs
CREATE INDEX IF NOT EXISTS "alert_logs_alertType_sentAt_idx" ON "alert_logs"("alertType", "sentAt");
CREATE INDEX IF NOT EXISTS "alert_logs_sentAt_idx" ON "alert_logs"("sentAt");
