# Portabilitäts-Fixes

## Problem

Mehrere Dateien enthielten hardcodierte absolute Pfade zu `/Users/lucasrodrigues/ricardo-clone`, was das Projekt nicht portabel machte.

## Behobene Probleme

### 1. Prisma Schema (`prisma/schema.prisma`)

**Vorher:**

```prisma
url = "file:/Users/lucasrodrigues/ricardo-clone/prisma/dev.db"
```

**Nachher:**

```prisma
url = env("DATABASE_URL")
```

**Hinweis:** Die `.env` Datei sollte `DATABASE_URL="file:./prisma/dev.db"` enthalten (relativer Pfad).

### 2. LaunchAgent-Dateien (`.plist`)

**Lösung:** Template-Dateien erstellt:

- `com.helvenda.devserver.plist.template`
- `com.helvenda.watchdog.plist.template`

Diese verwenden Platzhalter `__PROJECT_DIR__`, die beim Installieren durch das tatsächliche Projekt-Verzeichnis ersetzt werden.

**Install-Scripts aktualisiert:**

- `install-background-service.sh` - Ersetzt Pfade dynamisch
- `install-permanent-solution.sh` - Ersetzt Pfade dynamisch

### 3. PID-Problem in `check-and-start.sh`

**Vorher:**

```bash
./start-server.sh &
SERVER_PID=$!  # Falsch: PID des Shell-Scripts, nicht npm
```

**Nachher:**

```bash
./start-server.sh > /dev/null 2>&1 &
sleep 5
SERVER_PID=$(lsof -ti:$PORT)  # Korrekt: PID des tatsächlichen Prozesses
```

### 4. PID-Problem in `server-watchdog.sh`

**Vorher:**

```bash
nohup npm run dev > "$PWD/server.log" 2>&1 &
SERVER_PID=$!  # Falsch: PID des Shell-Scripts
```

**Nachher:**

```bash
nohup npm run dev > "$PWD/server.log" 2>&1 &
sleep 10
SERVER_PID=$(lsof -ti:$PORT 2>/dev/null || echo "")  # Korrekt: PID des tatsächlichen Prozesses
```

## Wichtige Änderungen

### Dateien aus Repository entfernt

Die folgenden Dateien mit hardcodierten Pfaden wurden aus dem Git-Repository entfernt:

- `.env.new` - Enthielt hardcodierten absoluten Pfad
- `.env.backup` - Enthielt hardcodierten absoluten Pfad
- `.env.tmp` - Temporäre Datei mit hardcodiertem Pfad
- `com.helvenda.devserver.plist` - Enthielt hardcodierte Pfade
- `com.helvenda.watchdog.plist` - Enthielt hardcodierte Pfade

**Hinweis:** Diese Dateien bleiben lokal erhalten, werden aber nicht mehr ins Repository committed. Stattdessen werden die `.plist.template` Dateien verwendet, die beim Installieren dynamisch angepasst werden.

### .gitignore aktualisiert

Die `.gitignore` wurde aktualisiert, um zukünftige solche Dateien zu ignorieren:

- Alle `.env.*` Dateien (außer `.env.example`)
- Alle `.plist` Dateien (außer `*.plist.template`)

## Verwendung

### Für neue Entwickler

1. **Repository klonen:**

   ```bash
   git clone <repository-url>
   cd ricardo-clone
   ```

2. **Umgebungsvariablen einrichten:**

   ```bash
   cp .env.example .env  # Falls vorhanden
   # Oder erstelle .env mit:
   # DATABASE_URL="file:./prisma/dev.db"
   ```

3. **Background-Service installieren (optional):**
   ```bash
   ./install-background-service.sh
   ```
   Das Script ersetzt automatisch alle Pfade mit dem aktuellen Projekt-Verzeichnis.

### Für Deployment

- Die `.plist.template` Dateien werden beim Installieren automatisch angepasst
- Die `DATABASE_URL` sollte über Umgebungsvariablen gesetzt werden
- Alle relativen Pfade funktionieren jetzt korrekt

## Rückwärtskompatibilität

Die alten `.plist` Dateien bleiben bestehen für Rückwärtskompatibilität, werden aber beim Installieren automatisch aktualisiert. Neue Installationen sollten die Template-Dateien verwenden.
