#!/bin/bash

# DNS Propagation Check Script
# Prüft ob die DNS-Einträge für helvenda.ch korrekt propagiert sind

echo "🔍 DNS Propagation Check für helvenda.ch"
echo "=========================================="
echo ""

DOMAIN="helvenda.ch"
WWW_DOMAIN="www.helvenda.ch"

echo "📡 Prüfe DNS-Einträge für $DOMAIN..."
echo ""

# Prüfe A Record
echo "1️⃣  A Record für $DOMAIN:"
dig +short $DOMAIN A 2>/dev/null | head -1
if [ $? -eq 0 ]; then
    echo "   ✅ DNS-Abfrage erfolgreich"
else
    echo "   ⚠️  DNS-Abfrage fehlgeschlagen"
fi
echo ""

# Prüfe CNAME für www
echo "2️⃣  CNAME Record für $WWW_DOMAIN:"
dig +short $WWW_DOMAIN CNAME 2>/dev/null | head -1
if [ $? -eq 0 ]; then
    echo "   ✅ DNS-Abfrage erfolgreich"
else
    echo "   ⚠️  DNS-Abfrage fehlgeschlagen"
fi
echo ""

echo "🌐 Online-Prüfung:"
echo "   - A Record: https://www.whatsmydns.net/#A/$DOMAIN"
echo "   - CNAME: https://www.whatsmydns.net/#CNAME/$WWW_DOMAIN"
echo ""
echo "⏱️  DNS-Propagierung kann 1-48 Stunden dauern"
echo ""

