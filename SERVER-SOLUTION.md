# 🛡️ Permanente Server-Lösung für Helvenda

## Problem gelöst ✅

Die Seite lädt nicht mehr oder Safari kann keine Verbindung herstellen? Diese Lösung stellt sicher, dass der Server **immer** läuft und automatisch neu startet bei Problemen.

## 🚀 Was wurde installiert

### 1. **Watchdog-Service** (Automatische Überwachung)
- Prüft **alle 30 Sekunden** ob der Server läuft
- Startet Server automatisch neu bei Fehlern
- Health-Check mit HTTP-Anfrage (nicht nur Port-Check)
- Maximale 5 Neustart-Versuche, dann 5 Minuten Pause

### 2. **Robuste Start-Scripts**
- `ensure-server-running.sh` - Startet Server sicher und prüft ob er antwortet
- `server-watchdog.sh` - Überwacht Server kontinuierlich
- Automatische Port-Bereinigung vor dem Start

### 3. **macOS LaunchAgent**
- Startet automatisch beim Login
- Läuft im Hintergrund
- Startet bei Fehlern automatisch neu

## 📋 Verfügbare Befehle

### Server-Status prüfen
```bash
./check-and-start.sh
```
Prüft ob Server läuft und startet ihn bei Bedarf.

### Server sicher neu starten
```bash
./ensure-server-running.sh
```
Beendet alle Prozesse, startet Server neu und prüft ob er antwortet.

### Watchdog-Logs ansehen
```bash
tail -f watchdog.log
```

### Server-Logs ansehen
```bash
tail -f server.log
```

### Watchdog beenden (falls nötig)
```bash
launchctl unload ~/Library/LaunchAgents/com.helvenda.watchdog.plist
```

### Watchdog neu starten
```bash
launchctl load ~/Library/LaunchAgents/com.helvenda.watchdog.plist
```

## 🔧 Wie es funktioniert

1. **Watchdog läuft im Hintergrund**
   - Prüft alle 30 Sekunden: Läuft der Server? Antwortet er?
   - Wenn nicht: Startet Server automatisch neu

2. **Health-Check**
   - Nicht nur Port-Check, sondern echte HTTP-Anfrage
   - Stellt sicher, dass Server wirklich funktioniert

3. **Automatischer Neustart**
   - Bei Fehlern wird Server automatisch neu gestartet
   - Maximale 5 Versuche, dann Pause

4. **Port-Bereinigung**
   - Beendet alle Prozesse auf Port 3002 vor dem Start
   - Verhindert Konflikte durch mehrere Server-Prozesse

## ✅ Vorteile

- ✅ **Server läuft immer** - Automatischer Neustart bei Fehlern
- ✅ **Health-Check** - Prüft ob Server wirklich antwortet
- ✅ **Keine manuelle Intervention** - Alles läuft automatisch
- ✅ **Logs verfügbar** - Einfaches Debugging
- ✅ **Robust** - Behandelt Port-Konflikte und Server-Abstürze

## 🎯 Ergebnis

Der Server läuft jetzt **permanent** und startet automatisch neu bei Problemen. Sie müssen sich nicht mehr darum kümmern!

## 📝 Logs

- **Watchdog-Logs**: `watchdog.log`
- **Server-Logs**: `server.log`
- **Watchdog-Errors**: `watchdog.error.log`

## 🔍 Troubleshooting

### Server läuft nicht?
```bash
./ensure-server-running.sh
```

### Watchdog läuft nicht?
```bash
launchctl list | grep helvenda
```

### Port ist belegt?
```bash
lsof -ti:3002 | xargs kill -9
./ensure-server-running.sh
```

### Alles zurücksetzen?
```bash
# Watchdog beenden
launchctl unload ~/Library/LaunchAgents/com.helvenda.watchdog.plist

# Alle Prozesse beenden
lsof -ti:3002 | xargs kill -9

# Neu installieren
./install-permanent-solution.sh
```

