#!/bin/bash

# Script zum Beheben von Prisma Client Cache-Problemen
# Dieses Script stoppt den Server, löscht den Cache und startet neu

echo "🔧 Prisma Client Cache-Problem beheben..."
echo ""

# 1. Server stoppen (falls läuft)
echo "1️⃣  Prüfe ob Server läuft..."
if lsof -ti:3002 > /dev/null 2>&1; then
    echo "   ⚠️  Server läuft auf Port 3002, stoppe..."
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    sleep 2
    echo "   ✅ Server gestoppt"
else
    echo "   ✅ Kein Server auf Port 3002 gefunden"
fi

# 2. Next.js Cache löschen
echo ""
echo "2️⃣  Lösche Next.js Cache..."
rm -rf .next
echo "   ✅ Cache gelöscht"

# 3. Prisma Client neu generieren
echo ""
echo "3️⃣  Generiere Prisma Client neu..."
npx prisma generate
echo "   ✅ Prisma Client generiert"

# 4. Prüfe ob ContactRequest Modell verfügbar ist
echo ""
echo "4️⃣  Prüfe ContactRequest Modell..."
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
if (p.contactRequest) {
    console.log('   ✅ ContactRequest Modell verfügbar');
    process.exit(0);
} else {
    console.log('   ❌ ContactRequest Modell NICHT verfügbar!');
    process.exit(1);
}
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Alles bereit! Starte Server mit: npm run dev"
    echo ""
    echo "📝 Oder starte automatisch? (j/n)"
    read -r response
    if [[ "$response" =~ ^[Jj]$ ]]; then
        echo ""
        echo "🚀 Starte Server..."
        npm run dev
    fi
else
    echo ""
    echo "❌ Fehler: ContactRequest Modell nicht verfügbar!"
    echo "   Bitte prüfe prisma/schema.prisma"
    exit 1
fi

