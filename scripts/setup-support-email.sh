#!/bin/bash

# Setup Script für support@helvenda.ch
# Dieses Script führt Sie durch den Setup-Prozess

echo "🚀 Setup für support@helvenda.ch"
echo "================================"
echo ""

# Prüfe ob RESEND_API_KEY gesetzt ist
if [ -z "$RESEND_API_KEY" ]; then
  echo "⚠️  RESEND_API_KEY ist nicht gesetzt"
  echo "   Bitte setzen Sie RESEND_API_KEY in Ihrer .env Datei"
  echo ""
fi

echo "📋 Checkliste für das Setup:"
echo ""
echo "1. Domain in Resend verifizieren:"
echo "   → Gehen Sie zu: https://resend.com/domains"
echo "   → Klicken Sie auf 'Add Domain'"
echo "   → Geben Sie 'helvenda.ch' ein"
echo "   → Fügen Sie die DNS-Records hinzu, die Resend zeigt"
echo ""
echo "2. DNS-Records hinzufügen:"
echo "   → SPF Record (TXT)"
echo "   → DKIM Record (TXT)"
echo "   → CNAME Record"
echo ""
echo "3. Vercel Environment Variable setzen:"
echo "   → Vercel Dashboard → Project → Settings → Environment Variables"
echo "   → Fügen Sie hinzu: RESEND_FROM_EMAIL = support@helvenda.ch"
echo ""
echo "4. E-Mail-Empfang einrichten (Cloudflare Email Routing):"
echo "   → Cloudflare Dashboard → Email → Email Routing"
echo "   → Aktivieren Sie Email Routing für helvenda.ch"
echo "   → Fügen Sie MX Records hinzu"
echo "   → Erstellen Sie Routing Rule: support@helvenda.ch → Ihre E-Mail"
echo ""
echo "5. Testen:"
echo "   → Senden Sie eine E-Mail an support@helvenda.ch"
echo "   → Prüfen Sie, ob sie ankommt"
echo ""
echo "📖 Detaillierte Anleitung: docs/RESEND_SUPPORT_EMAIL_SETUP.md"
echo ""
