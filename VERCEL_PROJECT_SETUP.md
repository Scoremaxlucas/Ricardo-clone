# 🚀 Vercel Projekt Setup - Schnellstart

Sie haben bereits ein Vercel-Konto und sind dabei, Ihr Projekt einzurichten.

## 🔐 Schritt 1: Bei Vercel einloggen

1. **Gehen Sie zu [vercel.com](https://vercel.com)**
2. **Klicken Sie auf "Log in"** (oben rechts)
3. **Wählen Sie "Continue with GitHub"**
4. **Autorisieren Sie Vercel** für den Zugriff auf Ihr GitHub-Konto

## 📦 Schritt 2: Projekt importieren

### Option A: Neues Projekt erstellen

1. **Gehen Sie zu [vercel.com/dashboard](https://vercel.com/dashboard)**
2. **Klicken Sie auf "Add New Project"** (oder "Import Project")
3. **Wählen Sie Ihr GitHub Repository:**
   - Sie sehen eine Liste Ihrer GitHub Repositories
   - Suchen Sie nach `Ricardo-clone` (oder `gregorgafner-dev/Ricardo-clone`)
   - Klicken Sie auf "Import"

4. **Projekt konfigurieren:**
   - **Project Name:** `helvenda` (oder ein anderer Name)
   - **Framework Preset:** Next.js (sollte automatisch erkannt werden)
   - **Root Directory:** `./` (Standard)
   - **Build Command:** `npm run build` (sollte automatisch erkannt werden)
   - **Output Directory:** `.next` (sollte automatisch erkannt werden)
   - **Install Command:** `npm install` (Standard)

5. **WICHTIG: Stoppen Sie hier!** Bevor Sie auf "Deploy" klicken, müssen wir zuerst Vercel Postgres einrichten!

### Option B: Bestehendes Projekt verwenden

Falls Sie bereits ein Projekt haben:
1. Gehen Sie zu Ihrem Projekt im Vercel Dashboard
2. Klicken Sie auf "Settings"
3. Prüfen Sie die Konfiguration

## 🗄️ Schritt 3: Vercel Postgres einrichten (WICHTIG: Vor dem Deployment!)

### 3.1 Datenbank erstellen

1. **Im Vercel Dashboard:**
   - Gehen Sie zu Ihrem Projekt
   - Klicken Sie auf den Tab **"Storage"** (oder **"Data"**)
   - Falls Sie noch kein Projekt haben, erstellen Sie zuerst das Projekt (aber deployen Sie noch nicht!)

2. **Klicken Sie auf "Create Database"**
3. **Wählen Sie "Postgres"**

4. **Datenbank konfigurieren:**
   - **Name:** `helvenda-db`
   - **Region:**
     - `Frankfurt` (fra1) - Empfohlen für Europa
     - `London` (lhr1) - Alternative für Europa
     - `Washington D.C.` (iad1) - Für USA
   - **Plan:** `Free` (für den Start)

5. **Nach der Erstellung:**
   - Klicken Sie auf die erstellte Datenbank
   - Gehen Sie zum Tab **".env.local"** oder **"Connection String"**
   - **Kopieren Sie die `POSTGRES_URL`** oder `DATABASE_URL`

Die URL sieht etwa so aus:
```
postgres://default:xxxxx@ep-xxxxx-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb
```

### 3.2 Environment Variables in Vercel setzen

1. **Im Vercel Dashboard:**
   - Gehen Sie zu Ihrem Projekt
   - Klicken Sie auf **"Settings"**
   - Klicken Sie auf **"Environment Variables"**

2. **Fügen Sie folgende Variablen hinzu:**

   **DATABASE_URL:**
   ```
   Key: DATABASE_URL
   Value: postgresql://default:xxxxx@ep-xxxxx-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true
   ```
   - WICHTIG: Ändern Sie `postgres://` zu `postgresql://` oder fügen Sie `?pgbouncer=true` hinzu
   - Umgebungen: ✅ Production, ✅ Preview, ✅ Development

   **NEXTAUTH_SECRET:**
   ```
   Key: NEXTAUTH_SECRET
   Value: [Generieren Sie einen Secret - siehe unten]
   ```
   - Umgebungen: ✅ Production, ✅ Preview, ✅ Development

   **CRON_SECRET:**
   ```
   Key: CRON_SECRET
   Value: [Generieren Sie einen Secret - siehe unten]
   ```
   - Umgebungen: ✅ Production, ✅ Preview, ✅ Development

   **NEXTAUTH_URL:**
   ```
   Key: NEXTAUTH_URL
   Value: https://ihre-domain.vercel.app
   ```
   - Wird nach dem ersten Deployment verfügbar sein
   - Umgebungen: ✅ Production, ✅ Preview, ✅ Development

   **NEXT_PUBLIC_BASE_URL:**
   ```
   Key: NEXT_PUBLIC_BASE_URL
   Value: https://ihre-domain.vercel.app
   ```
   - Umgebungen: ✅ Production, ✅ Preview, ✅ Development

   **NEXT_PUBLIC_APP_URL:**
   ```
   Key: NEXT_PUBLIC_APP_URL
   Value: https://ihre-domain.vercel.app
   ```
   - Umgebungen: ✅ Production, ✅ Preview, ✅ Development

### 3.3 Secrets generieren

Öffnen Sie ein Terminal und führen Sie aus:

```bash
# NEXTAUTH_SECRET generieren
openssl rand -base64 32

# CRON_SECRET generieren
openssl rand -base64 32
```

Kopieren Sie die generierten Secrets und fügen Sie sie in Vercel ein.

## 🔧 Schritt 4: Lokale Migration vorbereiten

### 4.1 DATABASE_URL lokal setzen

Erstellen Sie eine `.env.local` Datei im Projekt-Root:

```bash
# Kopieren Sie die DATABASE_URL von Vercel hierher
# WICHTIG: Ändern Sie postgres:// zu postgresql://
DATABASE_URL="postgresql://default:xxxxx@ep-xxxxx-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb?pgbouncer=true"
```

**Oder ohne Connection Pooling:**
```bash
DATABASE_URL="postgresql://default:xxxxx@ep-xxxxx-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb"
```

### 4.2 Prisma Client generieren

```bash
npx prisma generate
```

### 4.3 Datenbank-Schema erstellen

```bash
# Option A: Migration erstellen (Empfohlen)
npx prisma migrate dev --name migrate_to_postgresql

# Option B: Schema direkt pushen (Schneller für Tests)
npx prisma db push
```

### 4.4 Testen

```bash
npm run dev
```

Öffnen Sie `http://localhost:3002` und testen Sie:
- ✅ Homepage lädt
- ✅ User-Registrierung funktioniert
- ✅ Login funktioniert

## 🚀 Schritt 5: Code committen und deployen

### 5.1 Änderungen committen

```bash
git add .
git commit -m "Migrate to PostgreSQL and prepare for Vercel deployment"
git push
```

### 5.2 Vercel Deployment

**Option A: Automatisches Deployment**
- Wenn das Repository mit Vercel verbunden ist, wird automatisch deployt bei jedem Push zum `main` Branch

**Option B: Manuelles Deployment**
```bash
# Vercel CLI installieren (falls noch nicht installiert)
npm i -g vercel

# Einloggen
vercel login

# Deployen
vercel --prod
```

### 5.3 NEXTAUTH_URL aktualisieren

Nach dem ersten Deployment:
1. Kopieren Sie Ihre Vercel-URL (z.B. `https://helvenda.vercel.app` oder `https://helvenda-lucas-rodrigues.vercel.app`)
2. Gehen Sie zu Vercel Dashboard → Settings → Environment Variables
3. Aktualisieren Sie `NEXTAUTH_URL` mit Ihrer tatsächlichen URL
4. Aktualisieren Sie `NEXT_PUBLIC_BASE_URL` und `NEXT_PUBLIC_APP_URL`
5. Redeployen Sie das Projekt (oder warten Sie auf automatisches Redeploy)

## ✅ Checkliste

- [ ] Bei Vercel eingeloggt
- [ ] Projekt mit Vercel verbunden
- [ ] Vercel Postgres Datenbank erstellt
- [ ] `DATABASE_URL` kopiert
- [ ] `DATABASE_URL` in Vercel Environment Variables gesetzt
- [ ] `NEXTAUTH_SECRET` generiert und gesetzt
- [ ] `CRON_SECRET` generiert und gesetzt
- [ ] `DATABASE_URL` lokal in `.env.local` gesetzt
- [ ] `npx prisma generate` ausgeführt
- [ ] `npx prisma migrate dev` oder `npx prisma db push` ausgeführt
- [ ] Lokal getestet (`npm run dev`)
- [ ] Code committed und gepusht
- [ ] Vercel Deployment erfolgreich
- [ ] `NEXTAUTH_URL` mit der tatsächlichen Vercel-URL aktualisiert

## 🎯 Schnellstart-Befehle

```bash
# 1. Secrets generieren
openssl rand -base64 32  # Für NEXTAUTH_SECRET
openssl rand -base64 32  # Für CRON_SECRET

# 2. Lokale Migration
npx prisma generate
npx prisma migrate dev --name migrate_to_postgresql

# 3. Testen
npm run dev

# 4. Committen und pushen
git add .
git commit -m "Migrate to PostgreSQL"
git push
```

## 🆘 Troubleshooting

### Problem: "Error: P1001: Can't reach database server"

**Lösung:**
- Prüfen Sie die `DATABASE_URL` in Vercel
- Stellen Sie sicher, dass `postgresql://` verwendet wird (nicht `postgres://`)
- Fügen Sie `?pgbouncer=true` hinzu für Connection Pooling

### Problem: "Error: P1017: Server has closed the connection"

**Lösung:**
- Fügen Sie `?pgbouncer=true` zur DATABASE_URL hinzu
- Oder verwenden Sie die direkte Verbindung ohne Pooling

### Problem: Build schlägt fehl auf Vercel

**Lösung:**
- Prüfen Sie die Build Logs im Vercel Dashboard
- Stellen Sie sicher, dass alle Environment Variables gesetzt sind
- Prüfen Sie, ob `prisma generate` im Build Command enthalten ist

## 📚 Weitere Hilfe

- **Detaillierte Vercel Postgres Anleitung:** `SETUP_VERCEL_POSTGRES.md`
- **Vollständige Deployment-Anleitung:** `VERCEL_DEPLOYMENT.md`
- **Migrations-Anleitung:** `MIGRATION_TO_POSTGRES.md`

Viel Erfolg! 🚀


