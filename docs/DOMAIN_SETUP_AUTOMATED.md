# 🚀 Automatisierte Domain-Setup für helvenda.ch

## ⚠️ Wichtiger Hinweis

DNS-Einträge können **nicht automatisch** von mir geändert werden, da diese bei deinem Domain-Provider (Hostpoint, Switch, etc.) konfiguriert werden müssen.

**Was ich für dich tun kann:**
- ✅ Die benötigten DNS-Einträge vorbereiten
- ✅ Scripts erstellen für die Überprüfung
- ✅ Umgebungsvariablen vorbereiten
- ✅ Schritt-für-Schritt Anleitung geben

**Was du tun musst:**
- 🔧 DNS-Einträge bei deinem Domain-Provider hinzufügen

## 📋 Schritt 1: DNS-Einträge abrufen

Die genauen DNS-Einträge findest du in Vercel:

1. **Gehe zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains
2. **Klicke auf:** `helvenda.ch` → "Edit" oder "Learn more"
3. **Vercel zeigt dir:** Die exakten DNS-Einträge die benötigt werden

## 📋 Schritt 2: DNS-Einträge hinzufügen

Füge diese Einträge bei deinem Domain-Provider hinzu:

### Für helvenda.ch:
```
Typ:    A Record
Name:   @ (oder helvenda.ch)
Wert:   [IP-Adresse von Vercel - wird dir angezeigt]
TTL:    3600
```

**ODER** (falls A Record nicht funktioniert):
```
Typ:    CNAME Record
Name:   @ (oder helvenda.ch)
Wert:   cname.vercel-dns.com
TTL:    3600
```

### Für www.helvenda.ch:
```
Typ:    CNAME Record
Name:   www
Wert:   cname.vercel-dns.com
TTL:    3600
```

## 📋 Schritt 3: DNS-Propagierung prüfen

Nach dem Hinzufügen der DNS-Einträge:

```bash
# Führe dieses Script aus:
./scripts/check-dns-propagation.sh
```

Oder prüfe manuell:
- https://www.whatsmydns.net/#A/helvenda.ch
- https://www.whatsmydns.net/#CNAME/www.helvenda.ch

## 📋 Schritt 4: Domain in Vercel verifizieren

1. Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains
2. Klicke auf "Refresh" bei `helvenda.ch`
3. Warte auf "Valid Configuration"

## 📋 Schritt 5: Umgebungsvariablen aktualisieren

Nach erfolgreicher Verifizierung müssen die Umgebungsvariablen aktualisiert werden:

**Gehe zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/environment-variables

**Aktualisiere für Production:**
- `NEXTAUTH_URL` = `https://helvenda.ch`
- `NEXT_PUBLIC_BASE_URL` = `https://helvenda.ch`
- `NEXT_PUBLIC_APP_URL` = `https://helvenda.ch`

## 🔍 Troubleshooting Script

Falls Probleme auftreten, führe aus:

```bash
./scripts/troubleshoot-domain.sh
```

