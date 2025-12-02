# 🗄️ Vercel Postgres Setup - Schritt für Schritt

Diese Anleitung führt Sie durch die Einrichtung von Vercel Postgres für Helvenda.

## 📋 Voraussetzungen

- ✅ Vercel-Account (kostenlos unter [vercel.com](https://vercel.com))
- ✅ Projekt bereits auf Vercel verbunden (oder bereit zum Verbinden)

## 🔧 Schritt 1: Vercel Postgres Datenbank erstellen

### 1.1 Gehen Sie zum Vercel Dashboard

1. Öffnen Sie [vercel.com](https://vercel.com)
2. Melden Sie sich an
3. Gehen Sie zu Ihrem Projekt (oder erstellen Sie ein neues)

### 1.2 Storage erstellen

1. Klicken Sie auf den Tab **"Storage"** (oder **"Data"**)
2. Klicken Sie auf **"Create Database"**
3. Wählen Sie **"Postgres"**

### 1.3 Datenbank konfigurieren

- **Name:** `helvenda-db` (oder ein anderer Name Ihrer Wahl)
- **Region:** Wählen Sie eine Region nahe Ihren Nutzern
  - Für Europa: `Frankfurt` (fra1) oder `London` (lhr1)
  - Für USA: `Washington D.C.` (iad1) oder `San Francisco` (sfo1)
- **Plan:** Wählen Sie den **Free Plan** für den Start

### 1.4 Datenbank-URL kopieren

Nach der Erstellung:
1. Klicken Sie auf die erstellte Datenbank
2. Gehen Sie zum Tab **".env.local"** oder **"Connection String"**
3. Kopieren Sie die `POSTGRES_URL` oder `DATABASE_URL`

Die URL sieht etwa so aus:
```
postgres://default:xxxxx@ep-xxxxx-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb
```

## 🔐 Schritt 2: Environment Variables in Vercel setzen

### 2.1 Im Vercel Dashboard

1. Gehen Sie zu Ihrem Projekt
2. Klicken Sie auf **"Settings"**
3. Klicken Sie auf **"Environment Variables"**

### 2.2 DATABASE_URL hinzufügen

1. Klicken Sie auf **"Add New"**
2. **Key:** `DATABASE_URL`
3. **Value:** Fügen Sie die kopierte PostgreSQL-URL ein
4. Wählen Sie alle Umgebungen: ✅ **Production**, ✅ **Preview**, ✅ **Development**
5. Klicken Sie auf **"Save"**

### 2.3 Weitere wichtige Environment Variables

Stellen Sie sicher, dass folgende Variablen auch gesetzt sind:

```
NEXTAUTH_URL=https://ihre-domain.vercel.app
NEXTAUTH_SECRET=<generieren Sie einen sicheren Secret>
CRON_SECRET=<generieren Sie einen sicheren Secret>
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=https://ihre-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://ihre-domain.vercel.app
```

**Secrets generieren:**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -base64 32
```

## 🗄️ Schritt 3: Lokale Migration vorbereiten

### 3.1 DATABASE_URL lokal setzen

Erstellen Sie eine `.env.local` Datei (oder aktualisieren Sie `.env`):

```bash
# Kopieren Sie die DATABASE_URL von Vercel hierher
DATABASE_URL="postgresql://default:xxxxx@ep-xxxxx-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb"
```

**Wichtig:**
- Ersetzen Sie `postgres://` mit `postgresql://` (Prisma benötigt das)
- Oder fügen Sie `?pgbouncer=true` hinzu, wenn Sie Connection Pooling verwenden

### 3.2 Prisma Client neu generieren

```bash
npx prisma generate
```

## 🚀 Schritt 4: Datenbank-Schema erstellen

### Option A: Migration erstellen (Empfohlen)

```bash
npx prisma migrate dev --name migrate_to_postgresql
```

Dies erstellt:
- Eine neue Migration-Datei
- Die Tabellen in der PostgreSQL-Datenbank

### Option B: Schema direkt pushen (Schneller für Tests)

```bash
npx prisma db push
```

**Hinweis:** `db push` ist gut für Development, aber `migrate` ist besser für Production.

## ✅ Schritt 5: Verifizieren

### 5.1 Prisma Studio öffnen

```bash
npx prisma studio
```

Dies öffnet einen Browser mit einem Datenbank-Editor. Sie sollten sehen:
- ✅ Alle Tabellen wurden erstellt
- ✅ Die Datenbank ist leer (bereit für Daten)

### 5.2 Development Server testen

```bash
npm run dev
```

Testen Sie:
- ✅ Homepage lädt
- ✅ User-Registrierung funktioniert
- ✅ Login funktioniert
- ✅ Datenbank-Operationen funktionieren

## 🔄 Schritt 6: Daten migrieren (Optional)

Wenn Sie Daten von SQLite migrieren möchten:

### Option A: Manuelle Migration

1. Öffnen Sie beide Datenbanken in Prisma Studio:
   ```bash
   # Terminal 1: SQLite
   DATABASE_URL="file:./prisma/dev.db" npx prisma studio --port 5555

   # Terminal 2: PostgreSQL
   npx prisma studio --port 5556
   ```

2. Kopieren Sie die Daten manuell zwischen den Datenbanken

### Option B: Export/Import Script

Sie können ein Script erstellen, das Daten exportiert/importiert.

## 🚀 Schritt 7: Auf Vercel deployen

### 7.1 Commit und Push

```bash
git add .
git commit -m "Migrate to PostgreSQL"
git push
```

### 7.2 Vercel Deployment

Vercel wird automatisch deployen, wenn:
- ✅ Das Repository mit Vercel verbunden ist
- ✅ Die Environment Variables gesetzt sind
- ✅ Der Build erfolgreich ist

### 7.3 Build prüfen

1. Gehen Sie zum Vercel Dashboard
2. Klicken Sie auf das neueste Deployment
3. Prüfen Sie die **Build Logs**
4. Stellen Sie sicher, dass `prisma generate` erfolgreich läuft

## 🐛 Troubleshooting

### Problem: "Error: P1001: Can't reach database server"

**Lösung:**
- Prüfen Sie die `DATABASE_URL` in Vercel
- Stellen Sie sicher, dass die Datenbank erreichbar ist
- Prüfen Sie, ob die IP-Adresse nicht blockiert ist (Vercel Postgres erlaubt alle IPs standardmäßig)

### Problem: "Error: P1003: Database does not exist"

**Lösung:**
- Vercel Postgres erstellt automatisch eine Datenbank namens `verceldb`
- Stellen Sie sicher, dass die `DATABASE_URL` korrekt ist

### Problem: "Error: P1017: Server has closed the connection"

**Lösung:**
- Vercel Postgres verwendet Connection Pooling
- Fügen Sie `?pgbouncer=true` zur DATABASE_URL hinzu:
  ```
  postgresql://default:xxxxx@ep-xxxxx-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true
  ```

### Problem: Migration schlägt fehl auf Vercel

**Lösung:**
- Stellen Sie sicher, dass `DATABASE_URL` als Environment Variable gesetzt ist
- Prüfen Sie die Build Logs
- Führen Sie `npx prisma migrate deploy` lokal aus, um zu testen

## 📚 Nützliche Befehle

```bash
# Migration Status prüfen
npx prisma migrate status

# Migration zurücksetzen (Vorsicht!)
npx prisma migrate reset

# Prisma Studio öffnen
npx prisma studio

# Schema formatieren
npx prisma format

# Prisma Client neu generieren
npx prisma generate
```

## ✅ Checkliste

- [ ] Vercel Postgres Datenbank erstellt
- [ ] `DATABASE_URL` in Vercel Environment Variables gesetzt
- [ ] `DATABASE_URL` lokal in `.env.local` gesetzt
- [ ] `npx prisma generate` ausgeführt
- [ ] `npx prisma migrate dev` oder `npx prisma db push` ausgeführt
- [ ] Prisma Studio geöffnet und Tabellen verifiziert
- [ ] Development Server gestartet und getestet
- [ ] Code committed und gepusht
- [ ] Vercel Deployment erfolgreich

## 🎉 Fertig!

Sobald Sie diese Schritte abgeschlossen haben, ist Ihre Anwendung bereit für PostgreSQL auf Vercel!

Bei Fragen oder Problemen, siehe `VERCEL_DEPLOYMENT.md` oder die Vercel-Dokumentation.


