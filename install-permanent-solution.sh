#!/bin/bash

# Installiert die permanente Server-Lösung für Helvenda
# Mit automatischem Neustart und Health-Check

cd "$(dirname "$0")"

echo "🔧 Installiere permanente Server-Lösung für Helvenda..."
echo ""

# Mache Scripts ausführbar
chmod +x server-watchdog.sh
chmod +x ensure-server-running.sh
chmod +x start-server.sh
chmod +x check-and-start.sh

# Entferne alte LaunchAgent falls vorhanden
if [ -f ~/Library/LaunchAgents/com.helvenda.devserver.plist ]; then
    echo "🗑️  Entferne alte LaunchAgent..."
    launchctl unload ~/Library/LaunchAgents/com.helvenda.devserver.plist 2>/dev/null
    rm ~/Library/LaunchAgents/com.helvenda.devserver.plist
fi

# Installiere Watchdog LaunchAgent
echo "📦 Installiere Watchdog-Service..."
mkdir -p ~/Library/LaunchAgents

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
WATCHDOG_PLIST="com.helvenda.watchdog.plist"
TARGET_PLIST="$HOME/Library/LaunchAgents/$WATCHDOG_PLIST"

# Verwende Template falls vorhanden, sonst normale Datei
if [ -f "${WATCHDOG_PLIST}.template" ]; then
    # Ersetze Platzhalter mit aktuellem Projekt-Verzeichnis
    sed "s|__PROJECT_DIR__|$PROJECT_DIR|g" "${WATCHDOG_PLIST}.template" > "$TARGET_PLIST"
    
    # Validiere dass Platzhalter ersetzt wurde
    if grep -q "__PROJECT_DIR__" "$TARGET_PLIST" 2>/dev/null; then
        echo "❌ Fehler: Platzhalter __PROJECT_DIR__ wurde nicht ersetzt!"
        echo "   Bitte prüfen Sie die Template-Datei: ${WATCHDOG_PLIST}.template"
        rm -f "$TARGET_PLIST"
        exit 1
    fi
else
    # Fallback: Verwende normale Datei (für Rückwärtskompatibilität)
    if [ -f "$WATCHDOG_PLIST" ]; then
        sed "s|/Users/lucasrodrigues/ricardo-clone|$PROJECT_DIR|g" "$WATCHDOG_PLIST" > "$TARGET_PLIST"
    else
        echo "❌ Fehler: Weder ${WATCHDOG_PLIST}.template noch $WATCHDOG_PLIST gefunden"
        exit 1
    fi
fi

launchctl load "$TARGET_PLIST"

echo ""
echo "✅ Installation abgeschlossen!"
echo ""
echo "📋 Was wurde installiert:"
echo "   1. Watchdog-Service - Prüft alle 30 Sekunden ob Server läuft"
echo "   2. Automatischer Neustart bei Fehlern"
echo "   3. Health-Check mit HTTP-Anfrage"
echo ""
echo "🚀 Starte Server jetzt..."
./ensure-server-running.sh

echo ""
echo "📝 Nützliche Befehle:"
echo "   Status prüfen:     ./check-and-start.sh"
echo "   Server neu starten: ./ensure-server-running.sh"
echo "   Watchdog-Logs:     tail -f watchdog.log"
echo "   Server-Logs:       tail -f server.log"
echo ""
echo "🛑 Watchdog beenden:"
echo "   launchctl unload ~/Library/LaunchAgents/com.helvenda.watchdog.plist"

