# 🗄️ Migration zu PostgreSQL - Nächste Schritte

Die Migration von SQLite zu PostgreSQL wurde vorbereitet. Das Prisma Schema wurde aktualisiert.

## ✅ Was wurde bereits gemacht:

1. ✅ `prisma/schema.prisma` wurde von `sqlite` auf `postgresql` geändert
2. ✅ `package.json` wurde aktualisiert mit:
   - `postinstall`: Generiert automatisch Prisma Client
   - `build`: Generiert Prisma Client vor dem Build

## 📋 Nächste Schritte:

### Schritt 1: PostgreSQL-Datenbank einrichten

Sie haben drei Optionen:

#### Option A: Vercel Postgres (Empfohlen für Vercel Deployment)
1. Gehen Sie zu [vercel.com](https://vercel.com)
2. Dashboard → **Storage** → **Create Database** → **Postgres**
3. Wählen Sie einen Namen (z.B. `helvenda-db`)
4. Wählen Sie eine Region (z.B. `Frankfurt` für Europa)
5. Kopieren Sie die `DATABASE_URL`

#### Option B: Supabase (Kostenloser Plan verfügbar)
1. Gehen Sie zu [supabase.com](https://supabase.com)
2. Erstellen Sie ein neues Projekt
3. Gehen Sie zu **Settings** → **Database**
4. Kopieren Sie die **Connection String** (URI)

#### Option C: Neon (Serverless PostgreSQL)
1. Gehen Sie zu [neon.tech](https://neon.tech)
2. Erstellen Sie ein neues Projekt
3. Kopieren Sie die **Connection String**

### Schritt 2: Lokale Umgebungsvariable setzen

Erstellen Sie eine `.env.local` Datei (oder aktualisieren Sie `.env`):

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

**Wichtig:** Ersetzen Sie die Platzhalter mit Ihren echten Datenbank-Credentials.

### Schritt 3: Datenbank-Schema erstellen

Führen Sie eine der folgenden Optionen aus:

#### Option A: Migration erstellen (Empfohlen für Production)

```bash
# Erstellen Sie eine neue Migration
npx prisma migrate dev --name migrate_to_postgresql

# Oder für Production
npx prisma migrate deploy
```

#### Option B: Schema direkt pushen (Für schnelles Setup)

```bash
# Pusht das Schema direkt zur Datenbank (ohne Migration)
npx prisma db push
```

**Hinweis:** `db push` ist gut für Development, aber `migrate` ist besser für Production.

### Schritt 4: Prisma Client generieren

```bash
npx prisma generate
```

### Schritt 5: Daten migrieren (Optional)

Wenn Sie bereits Daten in SQLite haben, die Sie migrieren möchten:

#### Option A: Manuelle Migration mit Prisma Studio

1. Öffnen Sie beide Datenbanken:
   ```bash
   # SQLite Datenbank
   DATABASE_URL="file:./prisma/dev.db" npx prisma studio

   # PostgreSQL Datenbank (in einem anderen Terminal)
   DATABASE_URL="postgresql://..." npx prisma studio
   ```

2. Kopieren Sie die Daten manuell zwischen den Datenbanken

#### Option B: Export/Import Script erstellen

Sie können ein Script erstellen, das Daten von SQLite nach PostgreSQL exportiert/importiert.

### Schritt 6: Testen

1. Starten Sie den Development Server:
   ```bash
   npm run dev
   ```

2. Testen Sie wichtige Funktionen:
   - ✅ User-Registrierung
   - ✅ Login
   - ✅ Artikel erstellen
   - ✅ Datenbank-Operationen

### Schritt 7: Für Vercel Deployment

Wenn Sie auf Vercel deployen möchten:

1. Fügen Sie die `DATABASE_URL` als Environment Variable in Vercel hinzu
2. Stellen Sie sicher, dass `CRON_SECRET` gesetzt ist
3. Deployen Sie das Projekt

Siehe `VERCEL_DEPLOYMENT.md` für vollständige Anleitung.

## ⚠️ Wichtige Hinweise:

### Datenverlust-Warnung

- **Die SQLite-Datenbank bleibt unverändert** - Sie können weiterhin darauf zugreifen
- **Die PostgreSQL-Datenbank startet leer** - Sie müssen Daten manuell migrieren oder neu erstellen
- **Backup erstellen:** Machen Sie ein Backup Ihrer SQLite-Datenbank vor der Migration

### SQLite vs PostgreSQL Unterschiede

Die meisten Features sind kompatibel, aber beachten Sie:

- ✅ Alle Prisma-Typen sind kompatibel
- ✅ `@default(cuid())` funktioniert identisch
- ✅ `@default(now())` funktioniert identisch
- ✅ Relations funktionieren identisch
- ⚠️ SQLite-spezifische Queries müssen möglicherweise angepasst werden (falls vorhanden)

### Prüfen Sie Ihren Code

Suchen Sie nach SQLite-spezifischen Queries:

```bash
# Suche nach möglichen SQLite-spezifischen Code
grep -r "sqlite\|SQLite" src/
grep -r "\.db\|\.sqlite" src/
```

## 🐛 Troubleshooting

### Problem: "Error: P1001: Can't reach database server"

**Lösung:**
- Prüfen Sie die `DATABASE_URL`
- Stellen Sie sicher, dass die Datenbank erreichbar ist
- Prüfen Sie Firewall-Einstellungen

### Problem: "Error: P1003: Database does not exist"

**Lösung:**
- Erstellen Sie die Datenbank in Ihrem PostgreSQL-Server
- Oder verwenden Sie die Standard-Datenbank (meist `postgres`)

### Problem: "Error: P1017: Server has closed the connection"

**Lösung:**
- Prüfen Sie die Connection Pool-Einstellungen
- Fügen Sie `?connection_limit=1` zur DATABASE_URL hinzu

### Problem: Migration schlägt fehl

**Lösung:**
- Stellen Sie sicher, dass die Datenbank leer ist (oder verwenden Sie `db push`)
- Prüfen Sie die Prisma-Logs: `npx prisma migrate dev --create-only`

## 📚 Nützliche Befehle

```bash
# Schema formatieren
npx prisma format

# Prisma Studio öffnen (Datenbank-Editor)
npx prisma studio

# Migration Status prüfen
npx prisma migrate status

# Migration zurücksetzen (Vorsicht!)
npx prisma migrate reset

# Prisma Client neu generieren
npx prisma generate
```

## ✅ Checkliste

- [ ] PostgreSQL-Datenbank erstellt
- [ ] `DATABASE_URL` in `.env.local` gesetzt
- [ ] `npx prisma generate` ausgeführt
- [ ] `npx prisma db push` oder `npx prisma migrate dev` ausgeführt
- [ ] Development Server gestartet und getestet
- [ ] Wichtige Funktionen getestet
- [ ] Für Vercel: `DATABASE_URL` als Environment Variable hinzugefügt

## 🎉 Fertig!

Sobald Sie diese Schritte abgeschlossen haben, ist Ihre Anwendung bereit für PostgreSQL und kann auf Vercel deployed werden!

Bei Fragen oder Problemen, siehe `VERCEL_DEPLOYMENT.md` oder die Prisma-Dokumentation.











