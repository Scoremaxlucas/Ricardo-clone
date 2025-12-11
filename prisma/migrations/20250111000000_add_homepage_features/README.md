# Migration: Add Homepage Enhancement Features

## Übersicht
Diese Migration fügt alle Datenbank-Tabellen für die 10 Homepage-Features hinzu.

## Dateien
- `migration.sql` - SQLite-Version (für lokale Entwicklung)
- `../20250111000000_add_homepage_features_postgresql.sql` - PostgreSQL-Version (für Vercel)

## Verwendung

### Lokale Entwicklung (SQLite)
Die Migration wurde bereits lokal ausgeführt mit:
```bash
sqlite3 prisma/dev.db < migration.sql
```

### Vercel Deployment (PostgreSQL)
Für Vercel muss die PostgreSQL-Version verwendet werden:

**Option 1: Manuelle Migration auf Vercel**
1. Verbinde dich mit der Vercel PostgreSQL-Datenbank
2. Führe die PostgreSQL-Migration aus:
```bash
psql $DATABASE_URL < ../20250111000000_add_homepage_features_postgresql.sql
```

**Option 2: Prisma Migrate (Empfohlen)**
1. Stelle sicher, dass das Schema auf PostgreSQL umgestellt ist:
   - In `prisma/schema.prisma`: `provider = "postgresql"`
2. Führe die Migration aus:
```bash
npx prisma migrate deploy
```

## Unterschiede SQLite vs PostgreSQL

- **SQLite**: `DATETIME`, `INTEGER` für Booleans, `REAL` für Floats
- **PostgreSQL**: `TIMESTAMP(3)`, `BOOLEAN`, `DOUBLE PRECISION`
- **Foreign Keys**: PostgreSQL unterstützt `ON UPDATE CASCADE`, SQLite nicht

## Tabellen erstellt

1. `search_queries` - Feature 1
2. `product_stats` - Feature 2
3. `collections` + `collection_items` - Feature 4
4. `browsing_history` + `user_preferences` - Feature 5
5. `auction_viewers` - Feature 6
6. `stories` - Feature 8
7. `user_badges` + `user_streaks` + `daily_deals` + `rewards` - Feature 9
8. `ai_conversations` + `ai_search_results` - Feature 10
