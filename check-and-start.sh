#!/bin/bash

# Automatischer Server-Checker und Starter
# Prüft ob Server läuft und startet ihn falls nicht

cd "$(dirname "$0")"

PORT=3002

# Prüfe ob Server läuft
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✅ Server läuft bereits auf Port $PORT"
    echo "🌐 http://localhost:$PORT"
    exit 0
fi

echo "⚠️  Server läuft nicht. Starte Server..."
echo ""

# Starte Server im Hintergrund
./start-server.sh &
SERVER_PID=$!

# Warte kurz und prüfe ob Server gestartet wurde
sleep 5

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo ""
    echo "✅ Server erfolgreich gestartet!"
    echo "🌐 http://localhost:$PORT"
    echo ""
    echo "PID: $SERVER_PID"
    echo "Zum Beenden: kill $SERVER_PID"
else
    echo ""
    echo "❌ Server konnte nicht gestartet werden"
    echo "Bitte manuell starten: npm run dev"
    exit 1
fi


