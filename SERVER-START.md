# 🚀 Helvenda Server - Start-Anleitung

## Problem: "Safari kann die Verbindung nicht aufbauen"

Dieser Fehler tritt auf, wenn der Next.js Development Server nicht läuft.

## ✅ PERMANENTE LÖSUNGEN

### Option 1: Automatischer Start (Empfohlen)

```bash
# Prüft ob Server läuft und startet ihn automatisch falls nicht
npm run dev:check
```

oder direkt:

```bash
./check-and-start.sh
```

### Option 2: Manueller Start mit Script

```bash
# Startet den Server mit allen Checks
npm run dev:start
```

oder direkt:

```bash
./start-server.sh
```

### Option 3: Server-Status prüfen

```bash
# Zeigt an ob Server läuft
npm run dev:status
```

oder direkt:

```bash
./server-status.sh
```

### Option 4: Standard npm Start

```bash
npm run dev
```

## 🔧 Was die Scripts machen

### `start-server.sh`
- ✅ Prüft ob Port 3002 bereits belegt ist
- ✅ Erstellt `.env` falls nicht vorhanden
- ✅ Installiert Dependencies falls nötig
- ✅ Generiert Prisma Client falls nötig
- ✅ Startet den Server

### `check-and-start.sh`
- ✅ Prüft ob Server bereits läuft
- ✅ Startet Server automatisch falls nicht
- ✅ Zeigt Status und PID

### `server-status.sh`
- ✅ Zeigt Server-Status
- ✅ Zeigt PID und URL
- ✅ Gibt Anweisungen zum Beenden

## 🌐 Server-URL

Nach dem Start: **http://localhost:3002**

## 🛑 Server beenden

```bash
# Finde PID
lsof -ti:3002

# Beende Server
kill $(lsof -ti:3002)

# Oder mit Gewalt
kill -9 $(lsof -ti:3002)
```

## 💡 Option 5: Background Service (macOS) - PERMANENTE LÖSUNG

Installiert den Server als macOS Background Service. Der Server startet automatisch beim Login und läuft immer im Hintergrund.

### Installation:

```bash
./install-background-service.sh
```

### Deinstallation:

```bash
./uninstall-background-service.sh
```

### Service verwalten:

```bash
# Status prüfen
launchctl list | grep com.helvenda.devserver

# Stoppen
launchctl stop com.helvenda.devserver

# Starten
launchctl start com.helvenda.devserver

# Logs ansehen
tail -f server.log
tail -f server.error.log
```

**Vorteile:**
- ✅ Startet automatisch beim Login
- ✅ Läuft im Hintergrund
- ✅ Startet automatisch neu bei Fehlern
- ✅ Keine manuelle Intervention nötig

## 💡 Alternative: Automatischer Start beim Terminal-Öffnen

Füge diese Zeile zu deiner `~/.zshrc` hinzu:

```bash
# Auto-start Helvenda Server
cd /Users/lucasrodrigues/ricardo-clone && ./check-and-start.sh > /dev/null 2>&1 &
```

## 📝 Troubleshooting

### Port bereits belegt
```bash
# Beende alle Prozesse auf Port 3002
lsof -ti:3002 | xargs kill -9
```

### Server startet nicht
```bash
# Prüfe Logs
npm run dev

# Prüfe ob .env existiert
cat .env

# Prüfe ob Dependencies installiert sind
npm install
```

### Datenbank-Probleme
```bash
# Generiere Prisma Client neu
npx prisma generate

# Prüfe Datenbank
npx prisma studio
```

