# 🚀 Vercel CLI Setup - Schritt für Schritt

Vercel CLI wurde erfolgreich installiert. Jetzt müssen Sie sich einloggen und das Projekt importieren.

## 🔐 Schritt 1: Bei Vercel einloggen

Öffnen Sie ein Terminal und führen Sie aus:

```bash
cd /Users/lucasrodrigues/ricardo-clone
vercel login
```

**Was passiert:**
1. Vercel öffnet einen Browser
2. Sie werden aufgefordert, sich bei Vercel anzumelden
3. Wählen Sie "Continue with GitHub"
4. Autorisiert Vercel für den Zugriff

**Alternativ:** Falls der Browser nicht automatisch öffnet, kopieren Sie die URL aus dem Terminal und öffnen Sie sie manuell.

## 📦 Schritt 2: Projekt importieren

Nach dem Login führen Sie aus:

```bash
vercel
```

**Sie werden gefragt:**

1. **"Set up and deploy?"** → Antworten Sie mit `Y` (Yes)

2. **"Which scope?"** → Wählen Sie Ihren Account (z.B. `lucas-rodrigues-projects-1afdcdc5`)

3. **"Link to existing project?"** → Antworten Sie mit `N` (No) - wir erstellen ein neues Projekt

4. **"What's your project's name?"** → Geben Sie ein: `helvenda` (oder drücken Sie Enter für den Standard-Namen)

5. **"In which directory is your code located?"** → Drücken Sie Enter (Standard: `./`)

6. **"Want to override the settings?"** → Antworten Sie mit `N` (No) - die Standard-Einstellungen sind korrekt

**Vercel wird dann:**
- Das Projekt analysieren
- Dependencies installieren
- Build durchführen
- Deployen

## ⚠️ WICHTIG: Stoppen Sie vor dem Deployment!

**Bevor Sie `vercel` ausführen, sollten wir zuerst:**

1. ✅ Vercel Postgres einrichten
2. ✅ Environment Variables setzen
3. ✅ Lokale Migration durchführen

## 🗄️ Schritt 3: Vercel Postgres einrichten (Zuerst!)

### Option A: Via Vercel Dashboard (Empfohlen)

1. **Gehen Sie zu [vercel.com/dashboard](https://vercel.com/dashboard)**
2. **Klicken Sie auf "Storage"** (oder "Data")
3. **Klicken Sie auf "Create Database"**
4. **Wählen Sie "Postgres"**
5. **Konfigurieren Sie:**
   - Name: `helvenda-db`
   - Region: `Frankfurt` (fra1) oder eine andere Region
   - Plan: `Free`
6. **Kopieren Sie die `POSTGRES_URL` oder `DATABASE_URL`**

### Option B: Via Vercel CLI

```bash
vercel storage create postgres helvenda-db
```

## 🔧 Schritt 4: Environment Variables setzen

### Via Vercel Dashboard:

1. Gehen Sie zu Ihrem Projekt im Dashboard
2. Settings → Environment Variables
3. Fügen Sie hinzu:
   - `DATABASE_URL` = die PostgreSQL-URL
   - `NEXTAUTH_SECRET` = generieren Sie einen Secret
   - `CRON_SECRET` = generieren Sie einen Secret
   - `NEXTAUTH_URL` = wird nach dem Deployment verfügbar sein

### Via Vercel CLI:

```bash
# DATABASE_URL setzen
vercel env add DATABASE_URL production

# NEXTAUTH_SECRET setzen
vercel env add NEXTAUTH_SECRET production

# CRON_SECRET setzen
vercel env add CRON_SECRET production
```

## 📋 Schnellstart-Befehle

```bash
# 1. Einloggen
vercel login

# 2. Secrets generieren (in einem neuen Terminal)
openssl rand -base64 32  # Für NEXTAUTH_SECRET
openssl rand -base64 32  # Für CRON_SECRET

# 3. Projekt importieren (nach Login)
vercel

# 4. Environment Variables setzen (nach Projekt-Erstellung)
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add CRON_SECRET production
```

## ✅ Checkliste

- [ ] Vercel CLI installiert ✅
- [ ] `vercel login` ausgeführt
- [ ] Bei Vercel eingeloggt
- [ ] Vercel Postgres erstellt
- [ ] `DATABASE_URL` kopiert
- [ ] Environment Variables gesetzt
- [ ] Lokale Migration durchgeführt
- [ ] `vercel` ausgeführt (Projekt importiert)
- [ ] Deployment erfolgreich

## 🎯 Empfohlene Reihenfolge

1. **Zuerst:** Vercel Postgres im Dashboard einrichten
2. **Dann:** Environment Variables setzen
3. **Dann:** Lokale Migration (`npx prisma migrate dev`)
4. **Dann:** Projekt mit `vercel` importieren

Viel Erfolg! 🚀














