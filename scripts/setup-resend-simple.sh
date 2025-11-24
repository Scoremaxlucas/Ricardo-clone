#!/bin/bash

# Einfaches Setup-Script für Resend
# Verwendung: ./scripts/setup-resend-simple.sh

echo ""
echo "📧 RESEND E-MAIL-SETUP FÜR HELVENDA"
echo ""
echo "=================================================="
echo "Dieses Script hilft Ihnen beim Setup von Resend."
echo "=================================================="
echo ""

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "⚠️  .env Datei nicht gefunden. Erstelle neue .env Datei..."
    touch .env
fi

echo "📝 SCHRITT 1: Resend Account erstellen"
echo ""
echo "1. Gehen Sie zu: https://resend.com"
echo "2. Klicken Sie auf 'Sign Up'"
echo "3. Erstellen Sie ein kostenloses Konto mit Ihrer E-Mail"
echo "4. Bestätigen Sie Ihre E-Mail-Adresse"
echo ""
read -p "Haben Sie bereits ein Resend-Konto? (j/n): " has_account

if [[ ! "$has_account" =~ ^[jJyY] ]]; then
    echo ""
    echo "⚠️  Bitte erstellen Sie zuerst ein Resend-Konto."
    echo "   Gehen Sie zu: https://resend.com"
    echo ""
    exit 1
fi

echo ""
echo "📝 SCHRITT 2: API Key erstellen"
echo ""
echo "1. Loggen Sie sich bei Resend ein: https://resend.com/login"
echo "2. Gehen Sie zu 'API Keys' (im Menü links)"
echo "3. Klicken Sie auf 'Create API Key'"
echo "4. Geben Sie einen Namen ein (z.B. 'Helvenda Production')"
echo "5. Wählen Sie 'Full Access' oder 'Sending Access'"
echo "6. Klicken Sie auf 'Add'"
echo "7. Kopieren Sie den API Key (beginnt mit 're_')"
echo ""
read -p "Fügen Sie hier Ihren Resend API Key ein: " api_key

if [[ -z "$api_key" ]] || [[ ! "$api_key" =~ ^re_ ]]; then
    echo ""
    echo "❌ Ungültiger API Key. Der Key muss mit 're_' beginnen."
    exit 1
fi

echo ""
echo "📝 SCHRITT 3: Absender-E-Mail-Adresse"
echo ""
echo "Für Tests können Sie verwenden: onboarding@resend.dev"
echo "Für Produktion müssen Sie eine Domain verifizieren."
echo ""
read -p "Absender-E-Mail-Adresse (z.B. onboarding@resend.dev): " from_email

if [[ -z "$from_email" ]] || [[ ! "$from_email" =~ @ ]]; then
    echo ""
    echo "❌ Ungültige E-Mail-Adresse."
    exit 1
fi

echo ""
echo "📝 SCHRITT 4: .env Datei aktualisieren"
echo ""

# Entferne alte Resend-Einträge
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' '/^RESEND_API_KEY=/d' .env
    sed -i '' '/^RESEND_FROM_EMAIL=/d' .env
else
    # Linux
    sed -i '/^RESEND_API_KEY=/d' .env
    sed -i '/^RESEND_FROM_EMAIL=/d' .env
fi

# Füge neue Einträge hinzu
echo "" >> .env
echo "# Resend E-Mail-Konfiguration" >> .env
echo "RESEND_API_KEY=$api_key" >> .env
echo "RESEND_FROM_EMAIL=$from_email" >> .env

echo "✅ .env Datei wurde aktualisiert!"
echo ""
echo "📋 Zusammenfassung:"
echo "   API Key: ${api_key:0:10}..."
echo "   From Email: $from_email"
echo ""
echo "📝 Nächste Schritte:"
echo "   1. Server neu starten: npm run dev"
echo "   2. Registrieren Sie einen Test-User"
echo "   3. Überprüfen Sie, ob die Verifizierungs-E-Mail ankommt"
echo ""
echo "✅ Setup abgeschlossen!"
echo ""





