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
    # Korrekt: -i (lowercase) identifiziert Internet-Sockets, nicht -P (uppercase)
    if ! lsof -i:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
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

# Stelle sicher, dass .env existiert und kritische Variablen gesetzt sind
if [ ! -f .env ]; then
    echo "⚠️  .env Datei nicht gefunden. Erstelle Minimal-Konfiguration für Development..."
    echo "   WICHTIG: Diese Konfiguration ist nur für Development gedacht!"
    cat > .env << EOF
# Development-Konfiguration
# WICHTIG: Für Production müssen diese Werte geändert werden!
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_SECRET=development-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3002
EOF
    echo "✅ .env Datei erstellt (Development-Modus)"
elif [ -f .env ]; then
    # Prüfe ob kritische Variablen fehlen
    MISSING_VARS=()
    
    if ! grep -q "^DATABASE_URL=" .env 2>/dev/null; then
        MISSING_VARS+=("DATABASE_URL")
    fi
    
    if ! grep -q "^NEXTAUTH_SECRET=" .env 2>/dev/null; then
        MISSING_VARS+=("NEXTAUTH_SECRET")
    fi
    
    if ! grep -q "^NEXTAUTH_URL=" .env 2>/dev/null; then
        MISSING_VARS+=("NEXTAUTH_URL")
    fi
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "⚠️  Fehlende Umgebungsvariablen in .env: ${MISSING_VARS[*]}"
        echo "   Bitte fügen Sie diese manuell hinzu oder verwenden Sie .env.example als Vorlage"
    fi
    
    # Warnung wenn Development-Secret verwendet wird (nur Warnung, keine Änderung)
    if grep -q "^NEXTAUTH_SECRET=development-secret-key-change-in-production" .env 2>/dev/null; then
        echo "⚠️  WARNUNG: Development-Secret in .env erkannt. Für Production bitte ändern!"
    fi
fi

# Starte Server im Hintergrund
nohup npm run dev > "$PWD/server.log" 2>&1 &

echo "⏳ Warte auf Server-Start..."

# Warte bis Server antwortet
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if check_server_health; then
        # Hole die tatsächliche PID des Next.js Server-Prozesses auf Port 3002
        SERVER_PID=$(lsof -ti:$PORT 2>/dev/null | head -1)
        
        echo ""
        echo "✅ Server erfolgreich gestartet!"
        echo "🌐 http://localhost:$PORT"
        if [ -n "$SERVER_PID" ]; then
            echo "📋 PID: $SERVER_PID"
            echo "💡 Zum Beenden: kill $SERVER_PID"
        fi
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

