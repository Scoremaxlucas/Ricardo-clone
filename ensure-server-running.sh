#!/bin/bash

# Robustes Server-Start-Script
# Stellt sicher, dass der Server läuft und funktioniert

cd "$(dirname "$0")"

PORT=3002
MAX_WAIT=60  # Maximale Wartezeit in Sekunden

echo "🔍 Prüfe Server-Status..."

# Funktion zum Prüfen ob Server läuft und antwortet
check_server_health() {
    # Prüfe ob Port belegt ist
    if ! lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    fi
    
    # Prüfe ob Server antwortet (mit Timeout)
    if curl -s -f -o /dev/null -m 5 "http://localhost:$PORT" >/dev/null 2>&1; then
        return 0
    fi
    
    return 1
}

# Beende alle bestehenden Prozesse auf Port 3002
echo "🧹 Räume Port $PORT auf..."
lsof -ti:$PORT | xargs kill -9 2>/dev/null
sleep 3

# Prüfe ob Server jetzt läuft
if check_server_health; then
    echo "✅ Server läuft bereits und antwortet"
    echo "🌐 http://localhost:$PORT"
    exit 0
fi

# Starte Server
echo "🚀 Starte Server..."
cd "$(dirname "$0")"

# Stelle sicher, dass .env existiert
if [ ! -f .env ]; then
    echo "📝 Erstelle .env Datei..."
    cat > .env << EOF
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET=development-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3002
EOF
fi

# Starte Server im Hintergrund
nohup npm run dev > "$PWD/server.log" 2>&1 &
SERVER_PID=$!

echo "⏳ Warte auf Server-Start (PID: $SERVER_PID)..."

# Warte bis Server antwortet
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if check_server_health; then
        echo ""
        echo "✅ Server erfolgreich gestartet!"
        echo "🌐 http://localhost:$PORT"
        echo "📋 PID: $SERVER_PID"
        echo "📝 Logs: $PWD/server.log"
        exit 0
    fi
    
    sleep 2
    WAIT_TIME=$((WAIT_TIME + 2))
    echo -n "."
done

echo ""
echo "❌ Server konnte nicht gestartet werden (Timeout nach ${MAX_WAIT}s)"
echo "📋 Prüfe Logs: $PWD/server.log"
exit 1

