#!/bin/bash

# Automatisches Domain-Setup Script für helvenda.ch
# Prüft DNS-Einträge und gibt klare Anweisungen

echo "🚀 Automatisches Domain-Setup für helvenda.ch"
echo "=============================================="
echo ""

DOMAIN="helvenda.ch"
WWW_DOMAIN="www.helvenda.ch"

# Prüfe aktuelle DNS-Einträge
echo "1️⃣  Prüfe aktuelle DNS-Einträge..."
echo "   ──────────────────────────────"

# Prüfe A Record mit verschiedenen DNS-Servern
echo "   A Record für $DOMAIN:"
A_RECORD_GOOGLE=$(dig @8.8.8.8 +short A $DOMAIN 2>/dev/null)
A_RECORD_CLOUDFLARE=$(dig @1.1.1.1 +short A $DOMAIN 2>/dev/null)

if [ -z "$A_RECORD_GOOGLE" ] && [ -z "$A_RECORD_CLOUDFLARE" ]; then
    echo "   ❌ Kein A Record gefunden"
    echo "   ⚠️  DNS-Einträge müssen noch konfiguriert werden"
    NEEDS_SETUP=true
else
    echo "   ✅ A Record gefunden:"
    [ ! -z "$A_RECORD_GOOGLE" ] && echo "      Google DNS (8.8.8.8): $A_RECORD_GOOGLE"
    [ ! -z "$A_RECORD_CLOUDFLARE" ] && echo "      Cloudflare DNS (1.1.1.1): $A_RECORD_CLOUDFLARE"
    
    # Prüfe ob es die Vercel IP ist
    if [[ "$A_RECORD_GOOGLE" == "76.76.21.21" ]] || [[ "$A_RECORD_CLOUDFLARE" == "76.76.21.21" ]]; then
        echo "   ✅ Korrekte Vercel IP gefunden!"
        NEEDS_SETUP=false
    else
        echo "   ⚠️  IP-Adresse ist nicht die Vercel IP (76.76.21.21)"
        NEEDS_SETUP=true
    fi
fi
echo ""

# Prüfe CNAME für www
echo "   CNAME Record für $WWW_DOMAIN:"
CNAME_GOOGLE=$(dig @8.8.8.8 +short CNAME $WWW_DOMAIN 2>/dev/null)
CNAME_CLOUDFLARE=$(dig @1.1.1.1 +short CNAME $WWW_DOMAIN 2>/dev/null)

if [ -z "$CNAME_GOOGLE" ] && [ -z "$CNAME_CLOUDFLARE" ]; then
    echo "   ❌ Kein CNAME Record gefunden"
    echo "   ⚠️  DNS-Einträge müssen noch konfiguriert werden"
    NEEDS_SETUP=true
else
    echo "   ✅ CNAME Record gefunden:"
    [ ! -z "$CNAME_GOOGLE" ] && echo "      Google DNS (8.8.8.8): $CNAME_GOOGLE"
    [ ! -z "$CNAME_CLOUDFLARE" ] && echo "      Cloudflare DNS (1.1.1.1): $CNAME_CLOUDFLARE"
    
    if [[ "$CNAME_GOOGLE" == *"vercel-dns.com"* ]] || [[ "$CNAME_CLOUDFLARE" == *"vercel-dns.com"* ]]; then
        echo "   ✅ Korrekter Vercel CNAME gefunden!"
    else
        echo "   ⚠️  CNAME zeigt nicht auf Vercel (cname.vercel-dns.com)"
        NEEDS_SETUP=true
    fi
fi
echo ""

# Prüfe Nameserver
echo "2️⃣  Prüfe Domain-Registrar..."
echo "   ──────────────────────────────"
NAMESERVERS=$(whois $DOMAIN 2>/dev/null | grep -i "name server\|nameserver" | head -3)
if [ ! -z "$NAMESERVERS" ]; then
    echo "   Nameserver gefunden:"
    echo "$NAMESERVERS" | sed 's/^/      /'
else
    echo "   ⚠️  Konnte Nameserver nicht ermitteln"
fi
echo ""

# Zeige benötigte DNS-Einträge
echo "3️⃣  Benötigte DNS-Einträge:"
echo "   ──────────────────────────────"
echo ""
echo "   📋 Für $DOMAIN (Root Domain):"
echo "   ┌─────────────────────────────────────────┐"
echo "   │ Typ:    A Record                        │"
echo "   │ Name:   @ (oder $DOMAIN)               │"
echo "   │ Wert:   76.76.21.21                    │"
echo "   │ TTL:    3600 (oder Auto)               │"
echo "   └─────────────────────────────────────────┘"
echo ""
echo "   📋 Für $WWW_DOMAIN:"
echo "   ┌─────────────────────────────────────────┐"
echo "   │ Typ:    CNAME Record                    │"
echo "   │ Name:   www                             │"
echo "   │ Wert:   cname.vercel-dns.com           │"
echo "   │ TTL:    3600 (oder Auto)               │"
echo "   └─────────────────────────────────────────┘"
echo ""

# Zeige nächste Schritte
if [ "$NEEDS_SETUP" = true ]; then
    echo "4️⃣  Nächste Schritte:"
    echo "   ──────────────────────────────"
    echo ""
    echo "   ⚠️  DNS-Einträge müssen noch konfiguriert werden!"
    echo ""
    echo "   Schritt 1: Gehe zu Vercel Domain-Settings"
    echo "   → https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains"
    echo "   → Klicke auf 'helvenda.ch' → 'Edit' oder 'Learn more'"
    echo "   → Vercel zeigt dir die EXAKTEN DNS-Einträge"
    echo ""
    echo "   Schritt 2: Logge dich bei deinem Domain-Provider ein"
    echo "   → Gehe zu DNS-Verwaltung / DNS-Einstellungen"
    echo "   → Füge die oben genannten Einträge hinzu"
    echo "   → Speichere die Änderungen"
    echo ""
    echo "   Schritt 3: Warte auf DNS-Propagierung (5-15 Minuten)"
    echo "   → Führe aus: ./scripts/check-dns-propagation.sh"
    echo ""
    echo "   Schritt 4: Verifiziere in Vercel"
    echo "   → Gehe zurück zu Vercel Domain-Settings"
    echo "   → Klicke 'Refresh' bei helvenda.ch"
    echo "   → Warte auf 'Valid Configuration' ✅"
    echo ""
else
    echo "4️⃣  Status:"
    echo "   ──────────────────────────────"
    echo "   ✅ DNS-Einträge scheinen korrekt zu sein!"
    echo "   → Prüfe in Vercel: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains"
    echo "   → Klicke 'Refresh' bei helvenda.ch"
    echo ""
fi

echo "5️⃣  DNS-Propagierung prüfen:"
echo "   ──────────────────────────────"
echo "   Online: https://www.whatsmydns.net/#A/$DOMAIN"
echo "   Terminal: ./scripts/check-dns-propagation.sh"
echo ""

