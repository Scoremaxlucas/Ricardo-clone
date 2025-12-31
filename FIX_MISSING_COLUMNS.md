# Fix: Missing Database Columns

## Problem
Der Fehler `The column 'disputeReminderCount' does not exist in the current database` bedeutet, dass das Prisma-Schema Spalten definiert, die nicht in der Produktions-Datenbank existieren.

## Lösung

### Option 1: Vercel PostgreSQL Console (Empfohlen)

1. Öffne [Vercel Dashboard](https://vercel.com/dashboard)
2. Gehe zu deinem Projekt → **Storage** → **PostgreSQL**
3. Klicke auf **Query** Tab
4. Kopiere und führe folgendes SQL aus:

```sql
-- Add missing dispute columns
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeDeadline" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeFrozenAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeAttachments" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderSentAt" TIMESTAMP(3);
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "disputeReminderCount" INTEGER NOT NULL DEFAULT 0;

-- Add missing Stripe columns
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundId" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundStatus" TEXT;
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "stripeRefundedAt" TIMESTAMP(3);

-- Create index
CREATE INDEX IF NOT EXISTS "purchases_disputeStatus_idx" ON "purchases"("disputeStatus");
```

5. Nach Ausführung sollte der Fehler behoben sein.

### Option 2: Via Vercel CLI

```bash
# 1. Stelle sicher, dass Vercel CLI installiert ist
npm i -g vercel

# 2. Verbinde dich mit deinem Vercel-Projekt
vercel link

# 3. Ziehe die Umgebungsvariablen
vercel env pull .env.production.local

# 4. Führe das Fix-Script aus
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx tsx scripts/fix-missing-purchase-columns.ts

# 5. Oder verwende prisma db push
DATABASE_URL=$(grep DATABASE_URL .env.production.local | cut -d '=' -f2-) npx prisma db push
```

### Option 3: Redeploy

Das `vercel-build.sh` Script wurde aktualisiert, um fehlende Spalten automatisch hinzuzufügen:

```bash
git add .
git commit -m "fix: add missing database columns on build"
git push
```

Vercel wird automatisch neu deployen und versuchen, die fehlenden Spalten zu ergänzen.

## Verifizierung

Nach dem Fix, teste den Kauf-Prozess erneut auf https://helvenda.ch.

## Dateien

- `scripts/fix-missing-purchase-columns.sql` - SQL-Script für manuelle Ausführung
- `scripts/fix-missing-purchase-columns.ts` - Node.js-Script
- `vercel-build.sh` - Aktualisiertes Build-Script mit Fallback
