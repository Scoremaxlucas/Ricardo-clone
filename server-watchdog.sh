#!/bin/bash

# Helvenda Server Watchdog
# Prüft regelmäßig ob Server läuft und startet ihn bei Bedarf automatisch neu

cd "$(dirname "$0")"

PORT=3002
CHECK_INTERVAL=30  # Prüfe alle 30 Sekunden
MAX_RESTART_ATTEMPTS=5
RESTART_COUNT=0

# Log-Datei
LOG_FILE="$PWD/server-watchdog.log"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Watchdog gestartet" >> "$LOG_FILE"

# Funktion zum Prüfen ob Server läuft
check_server() {
    # Prüfe ob Port belegt ist
    # Korrekt: -i (lowercase) identifiziert Internet-Sockets, nicht -P (uppercase)
    if ! lsof -i:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
        return 1
    fi
    
    # Prüfe ob Server antwortet
    if curl -s -f -o /dev/null -m 5 "http://localhost:$PORT" >/dev/null 2>&1; then
        return 0
    fi
    
    return 1
}

# Funktion zum Starten des Servers
start_server() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Starte Server..." >> "$LOG_FILE"
    
    # Beende alle bestehenden Prozesse auf Port 3002
    lsof -ti:$PORT | xargs kill -9 2>/dev/null
    sleep 2
    
    # Starte Server im Hintergrund
    cd "$(dirname "$0")"
    nohup npm run dev > "$PWD/server.log" 2>&1 &
    
    # Warte auf Server-Start
    sleep 10
    
    # Hole die tatsächliche PID des Prozesses auf Port 3002
    SERVER_PID=$(lsof -ti:$PORT 2>/dev/null || echo "")
    
    # Prüfe ob Server erfolgreich gestartet wurde
    if check_server; then
        if [ -n "$SERVER_PID" ]; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ Server erfolgreich gestartet (PID: $SERVER_PID)" >> "$LOG_FILE"
        else
            echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ Server erfolgreich gestartet" >> "$LOG_FILE"
        fi
        RESTART_COUNT=0
        return 0
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ❌ Server konnte nicht gestartet werden" >> "$LOG_FILE"
        return 1
    fi
}

# Hauptschleife
while true; do
    if ! check_server; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - ⚠️  Server läuft nicht oder antwortet nicht" >> "$LOG_FILE"
        
        if [ $RESTART_COUNT -lt $MAX_RESTART_ATTEMPTS ]; then
            RESTART_COUNT=$((RESTART_COUNT + 1))
            echo "$(date '+%Y-%m-%d %H:%M:%S') - Versuch $RESTART_COUNT von $MAX_RESTART_ATTEMPTS" >> "$LOG_FILE"
            start_server
        else
            echo "$(date '+%Y-%m-%d %H:%M:%S') - ❌ Maximale Neustart-Versuche erreicht. Watchdog pausiert für 5 Minuten." >> "$LOG_FILE"
            RESTART_COUNT=0
            sleep 300  # Pause für 5 Minuten
        fi
    else
        # Server läuft - setze Counter zurück
        if [ $RESTART_COUNT -gt 0 ]; then
            echo "$(date '+%Y-%m-%d %H:%M:%S') - ✅ Server läuft wieder stabil" >> "$LOG_FILE"
            RESTART_COUNT=0
        fi
    fi
    
    sleep $CHECK_INTERVAL
done

