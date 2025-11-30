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

# Starte Server direkt mit npm run dev im Hintergrund
# (start-server.sh hat interaktive Prompts, die im Hintergrund nicht funktionieren)
echo "🚀 Starte Development Server im Hintergrund..."
nohup npm run dev > server.log 2>&1 &

# Warte kurz bis Server gestartet wurde
sleep 5

# Prüfe ob Server gestartet wurde
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    # Hole die PID des Prozesses, der tatsächlich auf Port 3002 lauscht
    # Bug Fix: -P und -t sind nicht kompatibel, verwende -ti:$PORT wie in ensure-server-running.sh
    # -sTCP:LISTEN Filter ist beim Extrahieren der PID unnötig und wird entfernt für Konsistenz
    ACTUAL_PID=$(lsof -ti:$PORT 2>/dev/null | head -1)
    echo ""
    echo "✅ Server erfolgreich gestartet!"
    echo "🌐 http://localhost:$PORT"
    echo ""
    if [ -n "$ACTUAL_PID" ]; then
        echo "PID: $ACTUAL_PID"
        echo "Zum Beenden: kill $ACTUAL_PID"
    fi
    echo ""
    echo "📋 Server-Logs: tail -f server.log"
else
    echo ""
    echo "❌ Server konnte nicht gestartet werden"
    echo ""
    echo "📋 Letzte Log-Ausgabe:"
    tail -20 server.log 2>/dev/null || echo "Keine Logs verfügbar"
    echo ""
    echo "Bitte manuell starten: npm run dev"
    exit 1
fi


