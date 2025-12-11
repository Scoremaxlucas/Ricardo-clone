# Vercel Migration Guide - Homepage Features

## Übersicht

Diese Anleitung erklärt, wie die Phase 0 Migration auf Vercel (PostgreSQL) ausgeführt wird.

## Voraussetzungen

- Vercel-Projekt mit PostgreSQL-Datenbank
- Zugriff auf Vercel-Dashboard oder CLI
- `DATABASE_URL` Environment Variable in Vercel gesetzt

## Schritt 1: Schema für PostgreSQL anpassen

Das Schema muss von SQLite auf PostgreSQL umgestellt werden:

**In `prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"  // Ändere von "sqlite" zu "postgresql"
  url      = env("DATABASE_URL")
}
```

**Oder automatisch mit Script:**

```bash
chmod +x scripts/setup-vercel-migration.sh
./scripts/setup-vercel-migration.sh
```

## Schritt 2: Migration ausführen

### Option A: Prisma Migrate (Empfohlen)

```bash
# Stelle sicher, dass DATABASE_URL auf PostgreSQL zeigt
export DATABASE_URL="postgresql://..."

# Führe Migration aus
npx prisma migrate deploy
```

### Option B: Manuelle Migration

```bash
# Verbinde dich mit Vercel PostgreSQL
psql $DATABASE_URL < prisma/migrations/20250111000000_add_homepage_features_postgresql.sql
```

### Option C: Via Vercel CLI

```bash
# In Vercel Dashboard: Settings → Environment Variables
# Stelle sicher, dass DATABASE_URL gesetzt ist

# Dann in Vercel Build Command oder via CLI:
vercel env pull .env.local
npx prisma migrate deploy
```

## Schritt 3: Prisma Client regenerieren

Nach der Migration:

```bash
npx prisma generate
```

## Unterschiede SQLite vs PostgreSQL

| Feature      | SQLite          | PostgreSQL         |
| ------------ | --------------- | ------------------ |
| Timestamps   | `DATETIME`      | `TIMESTAMP(3)`     |
| Booleans     | `INTEGER` (0/1) | `BOOLEAN`          |
| Floats       | `REAL`          | `DOUBLE PRECISION` |
| Foreign Keys | Limited         | Full support       |

## Verifikation

Nach erfolgreicher Migration sollten alle 14 Tabellen existieren:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'search_queries',
  'product_stats',
  'collections',
  'collection_items',
  'browsing_history',
  'user_preferences',
  'auction_viewers',
  'stories',
  'user_badges',
  'user_streaks',
  'daily_deals',
  'rewards',
  'ai_conversations',
  'ai_search_results'
)
ORDER BY table_name;
```

## Troubleshooting

### Fehler: "relation already exists"

- Tabellen existieren bereits
- Migration wurde bereits ausgeführt
- Lösung: Prüfe mit `SELECT * FROM _prisma_migrations;`

### Fehler: "provider mismatch"

- Schema zeigt auf SQLite, aber DATABASE_URL ist PostgreSQL
- Lösung: Ändere `provider = "postgresql"` im Schema

### Fehler: "connection refused"

- DATABASE_URL ist falsch oder nicht gesetzt
- Lösung: Prüfe Environment Variables in Vercel Dashboard

## Nächste Schritte

Nach erfolgreicher Migration:

1. ✅ Phase 0 ist komplett
2. 🚀 Bereit für Feature 1-10 Implementation
3. 📊 Alle Tabellen verfügbar für Features
