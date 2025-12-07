# ⚡ Schnell-Setup: helvenda.ch Domain

## 🎯 Was ich für dich vorbereitet habe:

✅ **Scripts erstellt:**
- `scripts/setup-domain-dns.sh` - Zeigt benötigte DNS-Einträge
- `scripts/check-dns-propagation.sh` - Prüft DNS-Propagierung
- `scripts/troubleshoot-domain.sh` - Troubleshooting-Hilfe

✅ **Dokumentation erstellt:**
- `docs/DOMAIN_SETUP_GUIDE.md` - Vollständige Anleitung
- `docs/DOMAIN_SETUP_AUTOMATED.md` - Automatisierte Schritte

## 🚀 Was du jetzt tun musst:

### Schritt 1: DNS-Einträge abrufen

**Gehe zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains

**Klicke auf:** `helvenda.ch` → "Edit" oder "Learn more"

**Vercel zeigt dir:** Die exakten DNS-Einträge die du brauchst

### Schritt 2: DNS-Einträge bei deinem Domain-Provider hinzufügen

**Typische Konfiguration:**

#### Für helvenda.ch:
```
Typ:    A Record
Name:   @ (oder helvenda.ch)
Wert:   [IP von Vercel - wird dir angezeigt]
TTL:    3600
```

#### Für www.helvenda.ch:
```
Typ:    CNAME Record
Name:   www
Wert:   cname.vercel-dns.com
TTL:    3600
```

### Schritt 3: DNS-Propagierung prüfen

```bash
./scripts/check-dns-propagation.sh
```

Oder online: https://www.whatsmydns.net/#A/helvenda.ch

### Schritt 4: Domain in Vercel verifizieren

1. Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains
2. Klicke "Refresh" bei `helvenda.ch`
3. Warte auf "Valid Configuration" ✅

### Schritt 5: Umgebungsvariablen aktualisieren

**Gehe zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/environment-variables

**Aktualisiere für Production:**
- `NEXTAUTH_URL` = `https://helvenda.ch`
- `NEXT_PUBLIC_BASE_URL` = `https://helvenda.ch`
- `NEXT_PUBLIC_APP_URL` = `https://helvenda.ch`

## ⚠️ Wichtig:

Ich kann **DNS-Einträge nicht automatisch ändern**, da diese bei deinem Domain-Provider konfiguriert werden müssen. Die Scripts helfen dir aber dabei, alles zu prüfen und zu verifizieren!

## 🆘 Hilfe benötigt?

Falls Probleme auftreten:
```bash
./scripts/troubleshoot-domain.sh
```

