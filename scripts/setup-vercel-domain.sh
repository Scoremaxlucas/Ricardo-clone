#!/bin/bash

# Setup Script für Domain wenn Vercel der Domain-Provider ist
# Wenn Vercel der Provider ist, sollten DNS-Einträge automatisch gesetzt sein

echo "🚀 Vercel Domain Setup für helvenda.ch"
echo "========================================"
echo ""

echo "ℹ️  Da Vercel dein Domain-Provider ist, sollten DNS-Einträge automatisch konfiguriert sein."
echo ""

echo "1️⃣  Prüfe aktuelle DNS-Einträge..."
echo "   ──────────────────────────────"

# Prüfe A Record
A_RECORD=$(dig @8.8.8.8 +short A helvenda.ch 2>/dev/null)
if [ -z "$A_RECORD" ]; then
    echo "   ❌ Kein A Record gefunden"
    echo "   ⚠️  DNS-Einträge müssen möglicherweise noch propagieren"
else
    echo "   ✅ A Record gefunden: $A_RECORD"
fi

# Prüfe CNAME
CNAME_RECORD=$(dig @8.8.8.8 +short CNAME www.helvenda.ch 2>/dev/null)
if [ -z "$CNAME_RECORD" ]; then
    echo "   ❌ Kein CNAME Record für www gefunden"
else
    echo "   ✅ CNAME Record gefunden: $CNAME_RECORD"
fi
echo ""

echo "2️⃣  Was du jetzt tun musst:"
echo "   ──────────────────────────────"
echo ""
echo "   Da Vercel dein Domain-Provider ist, gibt es zwei Möglichkeiten:"
echo ""
echo "   📋 Option 1: Domain in Vercel Dashboard verifizieren"
echo "   → Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains"
echo "   → Klicke auf 'helvenda.ch' → 'Refresh'"
echo "   → Warte auf 'Valid Configuration' ✅"
echo ""
echo "   📋 Option 2: Domain neu hinzufügen (falls Option 1 nicht funktioniert)"
echo "   → Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains"
echo "   → Entferne 'helvenda.ch' und 'www.helvenda.ch' (falls vorhanden)"
echo "   → Warte 2-3 Minuten"
echo "   → Füge 'helvenda.ch' erneut hinzu"
echo "   → Vercel sollte automatisch 'www.helvenda.ch' hinzufügen"
echo "   → Warte auf 'Valid Configuration' ✅"
echo ""
echo "   📋 Option 3: Vercel CLI verwenden (falls du eingeloggt bist)"
echo "   → Führe aus: vercel login"
echo "   → Dann: vercel domains add helvenda.ch helvenda"
echo ""

echo "3️⃣  Wenn 'Invalid Configuration' weiterhin besteht:"
echo "   ──────────────────────────────"
echo ""
echo "   ⚠️  Mögliche Ursachen:"
echo "   1. DNS-Propagierung noch nicht abgeschlossen (warte 1-48 Stunden)"
echo "   2. Domain wurde nicht korrekt zu Vercel hinzugefügt"
echo "   3. SSL-Zertifikat wird noch erstellt (kann 1-24 Stunden dauern)"
echo ""
echo "   ✅ Lösungen:"
echo "   → Prüfe DNS-Propagierung: https://www.whatsmydns.net/#A/helvenda.ch"
echo "   → Kontaktiere Vercel Support über das Dashboard"
echo "   → Prüfe Vercel Logs für Fehlermeldungen"
echo ""

echo "4️⃣  Prüfe Domain-Status:"
echo "   ──────────────────────────────"
echo "   → Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains"
echo "   → Klicke auf 'helvenda.ch' → 'Edit' oder 'Learn more'"
echo "   → Vercel zeigt dir den genauen Status und eventuelle Probleme"
echo ""

