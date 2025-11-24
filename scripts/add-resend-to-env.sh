#!/bin/bash

# Script zum Hinzufügen von Resend-Konfiguration zur .env Datei
# Verwendung: ./scripts/add-resend-to-env.sh YOUR_API_KEY

if [ -z "$1" ]; then
    echo "❌ Fehler: Bitte geben Sie den Resend API Key an"
    echo ""
    echo "Verwendung:"
    echo "  ./scripts/add-resend-to-env.sh re_xxxxxxxxxxxxx"
    echo ""
    echo "Oder manuell:"
    echo "  1. Öffnen Sie .env"
    echo "  2. Fügen Sie hinzu:"
    echo "     RESEND_API_KEY=re_xxxxxxxxxxxxx"
    echo "     RESEND_FROM_EMAIL=onboarding@resend.dev"
    exit 1
fi

API_KEY="$1"
FROM_EMAIL="${2:-onboarding@resend.dev}"

# Prüfe ob API Key gültig ist
if [[ ! "$API_KEY" =~ ^re_ ]]; then
    echo "❌ Fehler: API Key muss mit 're_' beginnen"
    exit 1
fi

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "⚠️  .env Datei nicht gefunden. Erstelle neue .env Datei..."
    touch .env
fi

# Entferne alte Resend-Einträge
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' '/^RESEND_API_KEY=/d' .env
    sed -i '' '/^RESEND_FROM_EMAIL=/d' .env
    sed -i '' '/^# Resend E-Mail-Konfiguration$/d' .env
else
    # Linux
    sed -i '/^RESEND_API_KEY=/d' .env
    sed -i '/^RESEND_FROM_EMAIL=/d' .env
    sed -i '/^# Resend E-Mail-Konfiguration$/d' .env
fi

# Füge neue Einträge hinzu
echo "" >> .env
echo "# Resend E-Mail-Konfiguration" >> .env
echo "RESEND_API_KEY=$API_KEY" >> .env
echo "RESEND_FROM_EMAIL=$FROM_EMAIL" >> .env

echo ""
echo "✅ Resend-Konfiguration wurde zur .env Datei hinzugefügt!"
echo ""
echo "📋 Zusammenfassung:"
echo "   API Key: ${API_KEY:0:10}..."
echo "   From Email: $FROM_EMAIL"
echo ""
echo "📝 Nächste Schritte:"
echo "   1. Server neu starten: npm run dev"
echo "   2. Registrieren Sie einen Test-User"
echo "   3. Überprüfen Sie, ob die Verifizierungs-E-Mail ankommt"
echo ""





