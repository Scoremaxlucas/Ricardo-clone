# Migration-Problem: Lösung und Erklärung

## 🔴 Das Problem

Es gibt **zwei Probleme** mit den Migrationen:

### Problem 1: Leeres Migrations-Verzeichnis ✅ BEHOBEN

- Verzeichnis `20251120145110_add_contact_deadline_and_last_bid_at/` existierte ohne `migration.sql` Datei
- **Lösung**: Verzeichnis wurde entfernt

### Problem 2: Bestehende Daten ohne contactDeadline ✅ BEHOBEN

- Es gibt **1 Purchase** in der Datenbank ohne `contactDeadline` Wert
- `contactDeadline` ist als **required** (`DateTime`) definiert
- Prisma kann keine required Spalte hinzufügen, wenn bereits Daten existieren

## ✅ Lösung (bereits angewendet)

### Schritt 1: Bestehende Daten aktualisieren

```sql
-- Setze contactDeadline für bestehende Purchases (7 Tage nach createdAt)
UPDATE purchases
SET contactDeadline = datetime(createdAt, '+7 days')
WHERE contactDeadline IS NULL;
```

### Schritt 2: Schema mit Default-Wert

```prisma
contactDeadline DateTime @default(now()) // Frist für Kontaktaufnahme (7 Tage nach Purchase)
```

### Schritt 3: Migration ausführen

```bash
npx prisma db push
npx prisma generate
```

## 📋 Was wurde gemacht

1. ✅ Leeres Migrations-Verzeichnis entfernt
2. ✅ Bestehende Purchases aktualisiert (contactDeadline gesetzt)
3. ✅ Schema mit Default-Wert versehen
4. ✅ Migration ausgeführt
5. ✅ Prisma Client neu generiert

## ⚠️ Wichtige Hinweise für zukünftige Migrationen

### 1. **Bestehende Daten beachten**

Wenn eine **required** Spalte hinzugefügt wird:

- **Option A**: Default-Wert im Schema definieren (`@default(...)`)
- **Option B**: Bestehende Daten vorher aktualisieren
- **Option C**: Spalte als optional machen (`DateTime?`)

### 2. **Migration-Reihenfolge**

- Prüfe immer zuerst, ob Daten vorhanden sind: `SELECT COUNT(*) FROM table;`
- Erstelle Backup vor Migrationen: `cp prisma/dev.db prisma/dev.db.backup`
- Teste Migrationen in Development-Umgebung zuerst

### 3. **contactDeadline Logik**

- **Neue Purchases**: `contactDeadline` wird automatisch auf `createdAt + 7 Tage` gesetzt (im Code)
- **Bestehende Purchases**: Wurden manuell aktualisiert auf `createdAt + 7 Tage`
- **Default**: `@default(now())` als Fallback

## 🔍 Prüfung nach Migration

```bash
# Prüfe ob alle Spalten vorhanden sind
sqlite3 prisma/dev.db "PRAGMA table_info(purchases);" | grep -E "(contactDeadline|paymentDeadline|trackingNumber|disputeOpenedAt)"

# Prüfe contactDeadline Werte
sqlite3 prisma/dev.db "SELECT id, createdAt, contactDeadline FROM purchases;"

# Prüfe Migration-Status
npx prisma migrate status
```

## 🚨 Falls Fehler auftreten

### Fehler: "Cannot add required column without default"

**Lösung**:

1. Bestehende Daten aktualisieren (siehe oben)
2. Default-Wert im Schema hinzufügen
3. Migration erneut ausführen

### Fehler: "Migration file not found"

**Lösung**: Leeres Migrations-Verzeichnis entfernen oder Migration-Datei erstellen

### Fehler: "Database is out of sync"

**Lösung**:

```bash
npx prisma db push
npx prisma generate
```

## ✅ Status

- ✅ Alle Migrationen erfolgreich ausgeführt
- ✅ Bestehende Daten erhalten und aktualisiert
- ✅ Neue Felder verfügbar:
  - `contactDeadline` (required, mit Default)
  - `paymentDeadline` (optional)
  - `trackingNumber` (optional)
  - `disputeOpenedAt` (optional)
  - `statusHistory` (optional)
