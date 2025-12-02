#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  BENUTZER VERIFIZIEREN - PRODUKTIONS-DATENBANK          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Schritt 1: DATABASE_URL aus Vercel holen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Öffne: https://vercel.com/dashboard"
echo "2. Wähle dein Projekt: helvenda-marketplace"
echo "3. Gehe zu: Settings → Environment Variables"
echo "4. Kopiere die DATABASE_URL (Production)"
echo ""
echo "📋 Schritt 2: Script ausführen"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Führe dann aus:"
echo ""
echo "  DATABASE_URL=\"deine-produktions-db-url\" npx tsx scripts/verify-all-users-direct.ts"
echo ""
echo "⚠️  WICHTIG: Stelle sicher, dass es die PRODUKTIONS-DATABASE_URL ist!"
echo ""

read -p "Hast du die DATABASE_URL aus Vercel? (j/n): " answer

if [ "$answer" = "j" ] || [ "$answer" = "J" ] || [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    echo ""
    read -p "Füge die DATABASE_URL ein: " db_url
    
    if [ -z "$db_url" ]; then
        echo "❌ DATABASE_URL ist leer!"
        exit 1
    fi
    
    echo ""
    echo "🔄 Führe Script aus..."
    echo ""
    
    DATABASE_URL="$db_url" npx tsx scripts/verify-all-users-direct.ts
else
    echo ""
    echo "📝 Bitte hole zuerst die DATABASE_URL aus Vercel."
    echo "   Dann führe dieses Script erneut aus."
fi
