#!/bin/bash

# Server Status Checker

PORT=3002

echo "🔍 Helvenda Server Status"
echo "========================"
echo ""

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    PID=$(lsof -ti:$PORT)
    echo "✅ Server läuft"
    echo "   Port: $PORT"
    echo "   PID: $PID"
    echo "   URL: http://localhost:$PORT"
    echo ""
    echo "Zum Beenden: kill $PID"
else
    echo "❌ Server läuft nicht"
    echo ""
    echo "Zum Starten:"
    echo "  ./start-server.sh"
    echo "  oder"
    echo "  npm run dev"
fi


