#!/bin/bash

# Automatischer Server-Checker und Starter
# Prüft ob Server läuft und startet ihn falls nicht

cd "$(dirname "$0")"

PORT=3002

# Prüfe ob Server läuft
# Korrekt: -i (lowercase) identifiziert Internet-Sockets, nicht -P (uppercase)
if lsof -i:$PORT -sTCP:LISTEN >/dev/null 2>&1 ; then
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

# Warte bis Server gestartet wurde mit Retry-Logik
MAX_WAIT=60  # Maximale Wartezeit in Sekunden
WAIT_TIME=0
echo "⏳ Warte auf Server-Start..."

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    # Prüfe ob Server gestartet wurde
    # Korrekt: -i (lowercase) identifiziert Internet-Sockets, nicht -P (uppercase)
    if lsof -i:$PORT -sTCP:LISTEN >/dev/null 2>&1 ; then
        # Prüfe auch ob Server tatsächlich antwortet (mit Timeout)
        if curl -s -f -o /dev/null -m 2 "http://localhost:$PORT" >/dev/null 2>&1; then
            # Hole die PID des Prozesses, der tatsächlich auf Port 3002 lauscht
            # Korrekt: -ti:$PORT gibt nur die PID zurück (ohne -sTCP:LISTEN Filter)
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
            exit 0
        fi
    fi
    
    sleep 2
    WAIT_TIME=$((WAIT_TIME + 2))
    echo -n "."
done

echo ""
echo "❌ Server konnte nicht gestartet werden (Timeout nach ${MAX_WAIT}s)"
echo ""
echo "📋 Letzte Log-Ausgabe:"
tail -20 server.log 2>/dev/null || echo "Keine Logs verfügbar"
echo ""
echo "Bitte manuell starten: npm run dev"
exit 1


