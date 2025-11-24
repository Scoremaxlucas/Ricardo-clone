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
cp com.helvenda.watchdog.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.helvenda.watchdog.plist

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

