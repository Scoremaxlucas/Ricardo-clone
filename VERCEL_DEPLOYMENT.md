# 🚀 Helvenda auf Vercel deployen

Diese Anleitung führt Sie Schritt für Schritt durch das Deployment von Helvenda auf Vercel.

## 📋 Voraussetzungen

- Ein Vercel-Account (kostenlos unter [vercel.com](https://vercel.com))
- Ein GitHub/GitLab/Bitbucket Repository mit Ihrem Code
- Zugriff auf alle benötigten API-Keys und Secrets

## ⚠️ Wichtiger Hinweis zur Datenbank

**Aktuell verwendet Helvenda SQLite**, was für Vercel nicht ideal ist, da:

- SQLite-Dateien sind nicht persistent auf Vercel
- Serverless-Funktionen haben kein Dateisystem für SQLite

**Empfohlene Lösung:** Migrieren Sie zu **PostgreSQL** (z.B. Vercel Postgres, Supabase, oder Neon).

### Option 1: Vercel Postgres (Empfohlen)

- Integriert nahtlos mit Vercel
- Kostenloser Plan verfügbar
- Automatische Backups

### Option 2: Supabase

- Kostenloser Plan mit PostgreSQL
- Einfache Migration möglich

### Option 3: Neon

- Serverless PostgreSQL
- Kostenloser Plan verfügbar

**Für diese Anleitung gehen wir davon aus, dass Sie zu PostgreSQL migrieren.**

---

## 🔧 Schritt 1: Datenbank-Migration vorbereiten

### 1.1 Prisma Schema aktualisieren

Ändern Sie `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Statt "sqlite"
  url      = env("DATABASE_URL")
}
```

### 1.2 Migration erstellen

```bash
npx prisma migrate dev --name migrate_to_postgres
```

---

## 📦 Schritt 2: Projekt auf Vercel verbinden

### Option A: Via Vercel Dashboard (Empfohlen)

1. **Gehen Sie zu [vercel.com](https://vercel.com)** und melden Sie sich an
2. **Klicken Sie auf "Add New Project"**
3. **Importieren Sie Ihr Git Repository:**
   - Wählen Sie GitHub/GitLab/Bitbucket
   - Wählen Sie das Repository `ricardo-clone` aus
   - Klicken Sie auf "Import"

### Option B: Via Vercel CLI

```bash
# Vercel CLI installieren
npm i -g vercel

# Im Projekt-Verzeichnis einloggen
vercel login

# Projekt deployen
vercel
```

---

## ⚙️ Schritt 3: Umgebungsvariablen konfigurieren

Im Vercel Dashboard, gehen Sie zu **Settings → Environment Variables** und fügen Sie folgende Variablen hinzu:

### 🔐 Authentifizierung (NextAuth.js)

```
NEXTAUTH_URL=https://ihre-domain.vercel.app
NEXTAUTH_SECRET=<generieren Sie einen sicheren Secret>
```

**NEXTAUTH_SECRET generieren:**

```bash
openssl rand -base64 32
```

### 🗄️ Datenbank

```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

**Für Vercel Postgres:**

- Gehen Sie zu Vercel Dashboard → Storage → Create Database → Postgres
- Kopieren Sie die `DATABASE_URL` aus dem Dashboard

### 📧 E-Mail (Resend - Empfohlen)

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@ihre-domain.com
```

**Oder SMTP (Fallback):**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ihre-email@gmail.com
SMTP_PASS=ihr-app-passwort
SMTP_FROM=noreply@ihre-domain.com
```

### 💳 Stripe (Zahlungen)

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 🌐 URLs

```
NEXT_PUBLIC_BASE_URL=https://ihre-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://ihre-domain.vercel.app
```

### 💰 Zahlungskonfiguration (Optional)

```
PAYMENT_CREDITOR_NAME=Score-Max GmbH
PAYMENT_STREET=In der Hauswiese
PAYMENT_STREET_NUMBER=2
PAYMENT_POSTAL_CODE=8125
PAYMENT_CITY=Zollikerberg
PAYMENT_COUNTRY=CH
PAYMENT_IBAN=CH07 8080 8005 4832 7893 1
PAYMENT_BIC=RAIFCH22
```

### ⏰ Cron Jobs

```
CRON_SECRET=<generieren Sie einen sicheren Secret>
```

**CRON_SECRET generieren:**

```bash
openssl rand -base64 32
```

### 🔧 Build-Konfiguration

Fügen Sie ein **Build Command** hinzu (falls nicht automatisch erkannt):

```
npm run build
```

Und **Install Command**:

```
npm install
```

---

## 🏗️ Schritt 4: Build-Einstellungen prüfen

### 4.1 Prisma Client generieren

Stellen Sie sicher, dass Prisma Client während des Builds generiert wird. Fügen Sie in `package.json` ein **postinstall** Script hinzu:

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

### 4.2 Vercel Build Command

Im Vercel Dashboard → Settings → General:

- **Build Command:** `npm run build`
- **Output Directory:** `.next` (automatisch)
- **Install Command:** `npm install`

---

## 🗄️ Schritt 5: Datenbank einrichten

### 5.1 Vercel Postgres verwenden

1. Im Vercel Dashboard → **Storage** → **Create Database** → **Postgres**
2. Wählen Sie einen Namen (z.B. `helvenda-db`)
3. Wählen Sie eine Region (z.B. `Frankfurt` für Europa)
4. Kopieren Sie die `DATABASE_URL` und fügen Sie sie als Environment Variable hinzu

### 5.2 Datenbank-Schema pushen

Nach dem ersten Deployment können Sie das Schema pushen:

```bash
# Lokal mit der Production-Datenbank verbinden
DATABASE_URL="ihre-production-database-url" npx prisma db push

# Oder Migrationen ausführen
DATABASE_URL="ihre-production-database-url" npx prisma migrate deploy
```

**Oder via Vercel CLI:**

```bash
vercel env pull .env.local
npx prisma db push
```

---

## 🚀 Schritt 6: Deployment

### 6.1 Automatisches Deployment

Nach dem Verbinden des Repositories wird automatisch bei jedem Push zum `main` Branch deployed.

### 6.2 Manuelles Deployment

```bash
# Production Deployment
vercel --prod

# Preview Deployment
vercel
```

---

## 🔄 Schritt 7: Cron Jobs konfigurieren

Die `vercel.json` ist bereits konfiguriert für Cron Jobs. Die Route `/api/cron` existiert bereits und wird täglich um 2:00 Uhr ausgeführt.

**Wichtig:** Stellen Sie sicher, dass `CRON_SECRET` als Environment Variable gesetzt ist (siehe Schritt 3).

Die Cron-Route verarbeitet automatisch Mahnungen für überfällige Rechnungen.

---

## ✅ Schritt 8: Nach dem Deployment prüfen

### 8.1 Funktionen testen

- ✅ Homepage lädt
- ✅ Login/Registrierung funktioniert
- ✅ Datenbank-Verbindung funktioniert
- ✅ E-Mails werden versendet
- ✅ Stripe-Zahlungen funktionieren

### 8.2 Logs prüfen

Im Vercel Dashboard → **Deployments** → **View Function Logs**

### 8.3 Datenbank prüfen

```bash
# Mit Vercel Postgres verbinden
vercel env pull .env.local
npx prisma studio
```

---

## 🐛 Häufige Probleme und Lösungen

### Problem: "Prisma Client not generated"

**Lösung:** Fügen Sie `prisma generate` zum Build Command hinzu:

```json
"build": "prisma generate && next build"
```

### Problem: "Database connection failed"

**Lösung:**

- Prüfen Sie die `DATABASE_URL` Environment Variable
- Stellen Sie sicher, dass die Datenbank erreichbar ist
- Prüfen Sie Firewall-Einstellungen

### Problem: "NEXTAUTH_URL mismatch"

**Lösung:** Stellen Sie sicher, dass `NEXTAUTH_URL` exakt mit Ihrer Vercel-URL übereinstimmt (inkl. `https://`)

### Problem: "Environment variables not found"

**Lösung:**

- Prüfen Sie, ob alle Environment Variables im Vercel Dashboard gesetzt sind
- Stellen Sie sicher, dass sie für "Production", "Preview" und "Development" gesetzt sind

### Problem: "Build fails"

**Lösung:**

- Prüfen Sie die Build Logs im Vercel Dashboard
- Stellen Sie sicher, dass alle Dependencies korrekt installiert werden
- Prüfen Sie TypeScript-Fehler lokal: `npm run build`

---

## 📚 Zusätzliche Ressourcen

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

---

## 🔐 Sicherheits-Checkliste

- ✅ Alle Secrets sind als Environment Variables gesetzt (nicht im Code)
- ✅ `NEXTAUTH_SECRET` ist stark und einzigartig
- ✅ Datenbank-Zugangsdaten sind sicher
- ✅ Stripe Keys sind Production Keys (nicht Test Keys)
- ✅ HTTPS ist aktiviert (automatisch bei Vercel)
- ✅ CORS ist korrekt konfiguriert

---

## 📞 Support

Bei Problemen:

1. Prüfen Sie die Vercel Logs
2. Prüfen Sie die Browser Console
3. Prüfen Sie die Network-Tab für API-Fehler
4. Kontaktieren Sie den Vercel Support

---

**Viel Erfolg beim Deployment! 🚀**
