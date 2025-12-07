#!/bin/bash

# Vercel Domain Info Script
# Zeigt alle wichtigen Informationen für die Domain-Konfiguration

echo "🔍 Vercel Domain Information für helvenda.ch"
echo "=============================================="
echo ""

echo "1️⃣  Aktuelle DNS-Einträge:"
echo "   ──────────────────────────────"
echo "   A Record für helvenda.ch:"
dig +short helvenda.ch A 2>/dev/null || echo "   ⚠️  Kein A Record gefunden"
echo ""
echo "   CNAME für www.helvenda.ch:"
dig +short www.helvenda.ch CNAME 2>/dev/null || echo "   ⚠️  Kein CNAME Record gefunden"
echo ""

echo "2️⃣  Benötigte DNS-Einträge (Standard Vercel):"
echo "   ──────────────────────────────"
echo "   Für helvenda.ch:"
echo "   - Typ: A Record"
echo "   - Name: @ (oder helvenda.ch)"
echo "   - Wert: 76.76.21.21 (oder IP von Vercel)"
echo ""
echo "   Für www.helvenda.ch:"
echo "   - Typ: CNAME Record"
echo "   - Name: www"
echo "   - Wert: cname.vercel-dns.com"
echo ""

echo "3️⃣  Vercel Domain-Status prüfen:"
echo "   ──────────────────────────────"
echo "   Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains"
echo "   Klicke auf helvenda.ch → 'Edit' oder 'Learn more'"
echo "   Vercel zeigt dir die EXAKTEN DNS-Einträge die benötigt werden"
echo ""

echo "4️⃣  Nächste Schritte:"
echo "   ──────────────────────────────"
echo "   1. Hole die exakten DNS-Einträge von Vercel (siehe Schritt 3)"
echo "   2. Füge diese bei deinem Domain-Provider hinzu"
echo "   3. Warte 5-15 Minuten"
echo "   4. Prüfe DNS-Propagierung: ./scripts/check-dns-propagation.sh"
echo "   5. Klicke 'Refresh' in Vercel Domain-Settings"
echo ""

