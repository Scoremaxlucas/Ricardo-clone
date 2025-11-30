#!/bin/bash

# Stripe Keys Setup Script
# Hilft beim Einrichten der Stripe-Keys in der .env Datei

echo "🔑 Stripe Keys Setup"
echo "===================="
echo ""

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "⚠️  .env Datei nicht gefunden. Erstelle sie..."
    touch .env
fi

# Frage nach Key-Typ
echo "Welchen Key-Typ möchten Sie verwenden?"
echo "1) Test-Keys (pk_test_... / sk_test_...) - für Entwicklung"
echo "2) Live-Keys (pk_live_... / sk_live_...) - für Produktion"
echo ""
read -p "Wählen Sie 1 oder 2: " key_type

if [ "$key_type" = "1" ]; then
    KEY_PREFIX="pk_test_"
    SECRET_PREFIX="sk_test_"
    echo ""
    echo "✅ Test-Modus ausgewählt (für Entwicklung)"
elif [ "$key_type" = "2" ]; then
    KEY_PREFIX="pk_live_"
    SECRET_PREFIX="sk_live_"
    echo ""
    echo "⚠️  LIVE-Modus ausgewählt (für Produktion)"
    echo "   Stellen Sie sicher, dass Sie wirklich Live-Keys verwenden möchten!"
else
    echo "❌ Ungültige Auswahl"
    exit 1
fi

echo ""
echo "Bitte geben Sie Ihre Stripe Keys ein:"
echo ""

# Publishable Key
read -p "Publishable Key ($KEY_PREFIX...): " publishable_key

if [[ ! "$publishable_key" =~ ^$KEY_PREFIX ]]; then
    echo "⚠️  Warnung: Der Key beginnt nicht mit $KEY_PREFIX"
    read -p "Trotzdem fortfahren? (j/n): " continue_anyway
    if [ "$continue_anyway" != "j" ]; then
        echo "❌ Abgebrochen"
        exit 1
    fi
fi

# Secret Key
read -p "Secret Key ($SECRET_PREFIX...): " secret_key

if [[ ! "$secret_key" =~ ^$SECRET_PREFIX ]]; then
    echo "⚠️  Warnung: Der Key beginnt nicht mit $SECRET_PREFIX"
    read -p "Trotzdem fortfahren? (j/n): " continue_anyway
    if [ "$continue_anyway" != "j" ]; then
        echo "❌ Abgebrochen"
        exit 1
    fi
fi

echo ""
echo "📝 Füge Keys zur .env Datei hinzu..."

# Entferne alte Stripe-Keys falls vorhanden
sed -i.bak '/^STRIPE_SECRET_KEY=/d' .env
sed -i.bak '/^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=/d' .env
rm -f .env.bak

# Füge neue Keys hinzu
echo "" >> .env
echo "# Stripe Configuration (für TWINT)" >> .env
echo "STRIPE_SECRET_KEY=$secret_key" >> .env
echo "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$publishable_key" >> .env

echo ""
echo "✅ Stripe Keys erfolgreich zur .env Datei hinzugefügt!"
echo ""
echo "📋 Prüfen Sie die Keys:"
grep STRIPE .env
echo ""
echo "🔄 Bitte starten Sie den Server neu:"
echo "   npm run dev"
echo ""

