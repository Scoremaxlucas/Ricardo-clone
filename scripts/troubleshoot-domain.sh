#!/bin/bash

# Domain Troubleshooting Script
# Hilft bei der Fehlerbehebung für helvenda.ch Domain

echo "🔧 Domain Troubleshooting für helvenda.ch"
echo "=========================================="
echo ""

echo "1️⃣  Prüfe aktuelle DNS-Einträge:"
echo "   ──────────────────────────────"
dig +short helvenda.ch A
dig +short www.helvenda.ch CNAME
echo ""

echo "2️⃣  Prüfe Vercel Domain-Status:"
echo "   ──────────────────────────────"
echo "   Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains"
echo "   Status sollte 'Valid Configuration' sein"
echo ""

echo "3️⃣  Prüfe Umgebungsvariablen:"
echo "   ──────────────────────────────"
echo "   Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/environment-variables"
echo "   Prüfe:"
echo "   - NEXTAUTH_URL = https://helvenda.ch"
echo "   - NEXT_PUBLIC_BASE_URL = https://helvenda.ch"
echo "   - NEXT_PUBLIC_APP_URL = https://helvenda.ch"
echo ""

echo "4️⃣  Häufige Probleme:"
echo "   ──────────────────────────────"
echo "   ❌ DNS-Einträge fehlen → Bei Domain-Provider hinzufügen"
echo "   ❌ DNS-Propagierung noch nicht abgeschlossen → Warte 1-48h"
echo "   ❌ Falsche DNS-Einträge → Prüfe exakte Werte in Vercel"
echo "   ❌ Domain nicht verifiziert → Klicke 'Refresh' in Vercel"
echo ""

echo "5️⃣  Nächste Schritte:"
echo "   ──────────────────────────────"
echo "   1. Prüfe DNS-Einträge bei deinem Domain-Provider"
echo "   2. Stelle sicher, dass die Einträge exakt so sind wie in Vercel angezeigt"
echo "   3. Warte auf DNS-Propagierung (5min - 48h)"
echo "   4. Klicke 'Refresh' in Vercel Domain-Settings"
echo "   5. Warte auf SSL-Zertifikat (1-24h)"
echo ""

