# 🎯 Exakte DNS-Konfiguration für helvenda.ch

## ⚠️ WICHTIG: Was du jetzt tun musst!

Basierend auf deinem Vercel Dashboard musst du die **Nameserver bei deinem Domain-Registrar ändern** (nicht bei Vercel!).

## 📋 Schritt 1: Finde deinen Domain-Registrar

Führe aus:
```bash
whois helvenda.ch | grep -i registrar
```

Oder prüfe deine Domain-Registrierungs-E-Mails.

## 📋 Schritt 2: Ändere die Nameserver

**Gehe zu deinem Domain-Registrar** (z.B. Hostpoint, Switch, Infomaniak, GoDaddy, etc.)

**Ändere die Nameserver zu:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

### Wie du das machst (je nach Provider):

#### Hostpoint:
1. Logge dich ein → https://www.hostpoint.ch
2. Gehe zu "Domains" → "DNS-Verwaltung"
3. Klicke auf "Nameserver ändern"
4. Setze:
   - Nameserver 1: `ns1.vercel-dns.com`
   - Nameserver 2: `ns2.vercel-dns.com`
5. Speichere

#### Switch:
1. Logge dich ein → https://www.switch.ch
2. Gehe zu "Domains" → "DNS-Einstellungen"
3. Ändere Nameserver zu:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
4. Speichere

#### Infomaniak:
1. Logge dich ein → https://www.infomaniak.com
2. Gehe zu "Domains" → "DNS"
3. Ändere Nameserver zu:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
4. Speichere

#### GoDaddy:
1. Logge dich ein → https://www.godaddy.com
2. Gehe zu "My Products" → "Domains"
3. Klicke auf `helvenda.ch` → "DNS"
4. Ändere Nameserver zu:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
5. Speichere

## 📋 Schritt 3: Warte auf Nameserver-Propagierung

Nach der Änderung kann es **1-48 Stunden** dauern, bis die Nameserver weltweit propagiert sind.

**Prüfe den Status:**
```bash
dig NS helvenda.ch
```

Oder online: https://www.whatsmydns.net/#NS/helvenda.ch

Die Nameserver sollten zeigen:
- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

## 📋 Schritt 4: Verifiziere in Vercel

Nach der Nameserver-Propagierung:

1. Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains
2. Klicke auf "Refresh" bei `helvenda.ch`
3. Warte auf "Valid Configuration" ✅

**Hinweis:** Vercel setzt dann automatisch den CNAME Record für `www.helvenda.ch`!

## 🔍 Prüfe aktuellen Status

Führe aus:
```bash
./scripts/configure-dns-exact.sh
```

## ⚠️ WICHTIGE HINWEISE:

1. **Die Nameserver-Änderung muss bei deinem Domain-Registrar gemacht werden**, nicht bei Vercel!
2. **Nach der Änderung kann es 1-48 Stunden dauern**, bis alles funktioniert
3. **Vercel verwaltet dann automatisch alle DNS-Einträge**, einschließlich des CNAME für `www.helvenda.ch`
4. **Du musst nichts manuell für `www.helvenda.ch` tun** - das macht Vercel automatisch!

## 🆘 Hilfe benötigt?

Falls du nicht weißt, wer dein Domain-Registrar ist:
1. Prüfe deine E-Mails zur Domain-Registrierung
2. Oder kontaktiere den Support deines Providers
3. Oder führe aus: `whois helvenda.ch | grep -i registrar`

