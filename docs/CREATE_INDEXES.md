# Performance-Indizes erstellen

Die Indizes sind **kritisch** für die Performance der Verkaufsseite. Ohne diese Indizes macht die Datenbank einen Full Table Scan, was sehr langsam ist.

## Option 1: Automatisch mit Script (Lokal)

Wenn du lokal eine Datenbankverbindung hast:

```bash
npx tsx scripts/create-indexes.ts
```

**Wichtig:** Stelle sicher, dass `DATABASE_URL` in deiner `.env.local` Datei gesetzt ist.

## Option 2: Manuell in der Datenbank (Empfohlen für Produktion)

Führe diese SQL-Befehle direkt in deiner PostgreSQL-Datenbank aus:

```sql
-- Index auf sellerId für schnelle Abfragen nach Verkäufer (Artikel)
CREATE INDEX IF NOT EXISTS "watches_sellerId_idx" ON "watches"("sellerId");

-- Zusammengesetzter Index für Sortierung nach createdAt bei sellerId-Filter (Artikel)
CREATE INDEX IF NOT EXISTS "watches_sellerId_createdAt_idx" ON "watches"("sellerId", "createdAt" DESC);

-- Index auf watchId (Artikel-ID) in bids für schnelle Gebots-Abfragen
CREATE INDEX IF NOT EXISTS "bids_watchId_idx" ON "bids"("watchId");

-- Zusammengesetzter Index für Sortierung nach amount bei watchId-Filter (Artikel-Gebote)
CREATE INDEX IF NOT EXISTS "bids_watchId_amount_idx" ON "bids"("watchId", "amount" DESC);

-- Index auf watchId (Artikel-ID) in purchases für schnelle Kauf-Abfragen
CREATE INDEX IF NOT EXISTS "purchases_watchId_idx" ON "purchases"("watchId");

-- Zusammengesetzter Index für Filterung nach Status bei watchId-Filter (Artikel-Käufe)
CREATE INDEX IF NOT EXISTS "purchases_watchId_status_idx" ON "purchases"("watchId", "status");
```

## Option 3: Via Vercel/Produktion

Wenn du Zugriff auf die Produktions-Datenbank hast:

1. Öffne deine Datenbank-Verwaltung (z.B. Vercel Postgres Dashboard)
2. Führe die SQL-Befehle aus `scripts/add-performance-indexes.sql` aus
3. Oder verwende einen SQL-Client mit deiner DATABASE_URL

## Erwartete Verbesserung

Nach dem Erstellen der Indizes sollte die Performance **80-90% schneller** sein!

Die wichtigsten Indizes sind:
- `watches_sellerId_idx` - **KRITISCH** für die Verkaufsseite
- `watches_sellerId_createdAt_idx` - Für Sortierung

## Prüfen ob Indizes existieren

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('watches', 'bids', 'purchases')
ORDER BY tablename, indexname;
```

