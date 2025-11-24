#!/bin/bash

# Helvenda Development Server Starter
# Startet den Next.js Development Server automatisch

cd "$(dirname "$0")"

PORT=3002
HOST="0.0.0.0"

echo "🚀 Helvenda Development Server Starter"
echo "========================================"
echo ""

# Prüfe ob Port bereits belegt ist
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port $PORT ist bereits belegt!"
    echo ""
    echo "Möchten Sie den bestehenden Prozess beenden? (j/n)"
    read -r response
    if [[ "$response" =~ ^[Jj]$ ]]; then
        echo "🛑 Beende bestehenden Prozess..."
        lsof -ti:$PORT | xargs kill -9 2>/dev/null
        sleep 2
        echo "✅ Prozess beendet"
    else
        echo "❌ Abgebrochen"
        exit 1
    fi
fi

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "⚠️  .env Datei nicht gefunden. Erstelle Standard-Konfiguration..."
    cat > .env << EOF
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_SECRET=development-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3002
EOF
    echo "✅ .env Datei erstellt"
fi

# Prüfe ob node_modules existiert
if [ ! -d "node_modules" ]; then
    echo "📦 Installiere Dependencies..."
    npm install
fi

# Prüfe ob Prisma Client generiert wurde
if [ ! -d "node_modules/.prisma" ]; then
    echo "🔧 Generiere Prisma Client..."
    npx prisma generate
fi

echo ""
echo "🌐 Starte Development Server auf http://localhost:$PORT"
echo "   (Drücken Sie Ctrl+C zum Beenden)"
echo ""
echo "========================================"
echo ""

# Starte Server
npm run dev


