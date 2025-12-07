# 🚀 Vercel Domain Setup - helvenda.ch

## ✅ Gute Nachricht!

Da **Vercel dein Domain-Provider ist**, sollten die DNS-Einträge **automatisch** konfiguriert sein! Du musst normalerweise nichts manuell ändern.

## 🔍 Warum "Invalid Configuration"?

Wenn du trotzdem "Invalid Configuration" siehst, kann das folgende Gründe haben:

1. **DNS-Propagierung noch nicht abgeschlossen** (1-48 Stunden)
2. **Domain wurde noch nicht richtig zu Vercel hinzugefügt**
3. **SSL-Zertifikat wird noch erstellt** (1-24 Stunden)

## 🎯 Lösung: Schritt-für-Schritt

### Schritt 1: Domain in Vercel Dashboard prüfen

1. **Gehe zu:** https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains
2. **Klicke auf:** `helvenda.ch` → "Edit" oder "Learn more"
3. **Prüfe:** Was zeigt Vercel als Status an?

### Schritt 2: Domain verifizieren

**Option A: Refresh klicken**
- Klicke auf **"Refresh"** bei `helvenda.ch`
- Warte 2-5 Minuten
- Status sollte auf "Valid Configuration" wechseln ✅

**Option B: Domain neu hinzufügen** (falls Option A nicht funktioniert)
1. Entferne `helvenda.ch` und `www.helvenda.ch` aus Vercel
2. Warte 2-3 Minuten
3. Füge `helvenda.ch` erneut hinzu
4. Vercel sollte automatisch `www.helvenda.ch` hinzufügen
5. Warte auf "Valid Configuration" ✅

### Schritt 3: DNS-Propagierung prüfen

Nach dem Refresh/Neu-Hinzufügen:

```bash
./scripts/check-dns-propagation.sh
```

Oder online:
- https://www.whatsmydns.net/#A/helvenda.ch
- https://www.whatsmydns.net/#CNAME/www.helvenda.ch

### Schritt 4: SSL-Zertifikat abwarten

Nach erfolgreicher DNS-Verifizierung:
- Vercel erstellt automatisch ein SSL-Zertifikat
- **Dauer:** 1-24 Stunden
- Status sollte dann "Valid Configuration" sein

## 🆘 Wenn es weiterhin nicht funktioniert

### Prüfe Vercel Logs:
1. Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/logs
2. Prüfe auf Fehlermeldungen bezüglich der Domain

### Kontaktiere Vercel Support:
1. Gehe zu: https://vercel.com/support
2. Erkläre, dass Vercel dein Domain-Provider ist
3. Erwähne die "Invalid Configuration" Meldung

### Alternative: Vercel CLI verwenden

Falls du die Vercel CLI verwenden möchtest:

```bash
# 1. Einloggen
vercel login

# 2. Domain hinzufügen
vercel domains add helvenda.ch helvenda

# 3. Domain-Status prüfen
vercel domains inspect helvenda.ch
```

## 📋 Checkliste

- [ ] Domain in Vercel Dashboard geprüft
- [ ] "Refresh" bei helvenda.ch geklickt
- [ ] DNS-Propagierung geprüft (5-15 Minuten gewartet)
- [ ] SSL-Zertifikat aktiv (Status: "Valid Configuration")
- [ ] Domain funktioniert im Browser (https://helvenda.ch)

## ⚡ Schnell-Script

Führe aus:
```bash
./scripts/setup-vercel-domain.sh
```

Dieses Script prüft alles automatisch und gibt dir klare Anweisungen!

