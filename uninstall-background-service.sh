#!/bin/bash

# Entfernt den Helvenda Background Service

SERVICE_NAME="com.helvenda.devserver"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
TARGET_PATH="$LAUNCH_AGENTS_DIR/$SERVICE_NAME.plist"

echo "🛑 Helvenda Background Service Deinstaller"
echo "==========================================="
echo ""

if [ ! -f "$TARGET_PATH" ]; then
    echo "⚠️  Service ist nicht installiert"
    exit 0
fi

echo "🛑 Stoppe Service..."
launchctl unload "$TARGET_PATH" 2>/dev/null
launchctl stop "$SERVICE_NAME" 2>/dev/null

echo "🗑️  Entferne Service..."
rm "$TARGET_PATH"

echo ""
echo "✅ Service erfolgreich entfernt"


