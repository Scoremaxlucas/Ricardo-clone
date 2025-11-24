#!/bin/bash

# Installiert den Helvenda Server als Background-Service auf macOS
# Der Server startet automatisch beim Login und läuft im Hintergrund

cd "$(dirname "$0")"

SERVICE_NAME="com.helvenda.devserver"
PLIST_FILE="$SERVICE_NAME.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
TARGET_PATH="$LAUNCH_AGENTS_DIR/$PLIST_FILE"

echo "🔧 Helvenda Background Service Installer"
echo "=========================================="
echo ""

# Prüfe ob bereits installiert
if [ -f "$TARGET_PATH" ]; then
    echo "⚠️  Service ist bereits installiert"
    echo ""
    echo "Möchten Sie ihn neu installieren? (j/n)"
    read -r response
    if [[ ! "$response" =~ ^[Jj]$ ]]; then
        echo "❌ Abgebrochen"
        exit 0
    fi
    
    echo "🛑 Entferne alten Service..."
    launchctl unload "$TARGET_PATH" 2>/dev/null
    rm "$TARGET_PATH"
    echo "✅ Alter Service entfernt"
    echo ""
fi

# Kopiere plist Datei
echo "📋 Installiere Service..."
mkdir -p "$LAUNCH_AGENTS_DIR"
cp "$PLIST_FILE" "$TARGET_PATH"

# Lade Service
echo "🚀 Starte Service..."
launchctl load "$TARGET_PATH"
launchctl start "$SERVICE_NAME"

sleep 2

# Prüfe Status
if launchctl list | grep -q "$SERVICE_NAME"; then
    echo ""
    echo "✅ Service erfolgreich installiert und gestartet!"
    echo ""
    echo "📋 Service-Informationen:"
    echo "   Name: $SERVICE_NAME"
    echo "   Status: Läuft"
    echo "   URL: http://localhost:3002"
    echo ""
    echo "📝 Logs:"
    echo "   Output: server.log"
    echo "   Errors: server.error.log"
    echo ""
    echo "🔧 Service-Befehle:"
    echo "   Status prüfen: launchctl list | grep $SERVICE_NAME"
    echo "   Stoppen: launchctl stop $SERVICE_NAME"
    echo "   Starten: launchctl start $SERVICE_NAME"
    echo "   Entfernen: ./uninstall-background-service.sh"
else
    echo ""
    echo "❌ Service konnte nicht gestartet werden"
    echo "Bitte manuell prüfen: launchctl list | grep $SERVICE_NAME"
    exit 1
fi


