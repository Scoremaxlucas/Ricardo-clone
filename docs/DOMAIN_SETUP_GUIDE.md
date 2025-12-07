# 🔧 Domain Setup Guide: helvenda.ch auf Vercel

## Warum "Invalid Configuration"?

Die Meldung "Invalid Configuration" erscheint, wenn Vercel die Domain nicht verifizieren kann. Dies passiert normalerweise aus folgenden Gründen:

### 1. **DNS-Einträge fehlen oder sind falsch**
Vercel benötigt spezifische DNS-Einträge, um die Domain zu verifizieren und SSL-Zertifikate auszustellen.

### 2. **DNS-Propagierung noch nicht abgeschlossen**
Nach dem Hinzufügen der DNS-Einträge kann es 1-48 Stunden dauern, bis diese weltweit propagiert sind.

### 3. **Falsche DNS-Konfiguration**
Die DNS-Einträge müssen exakt so konfiguriert sein, wie Vercel sie angibt.

## ✅ Lösung: Schritt-für-Schritt Anleitung

### Schritt 1: DNS-Einträge von Vercel abrufen

1. Gehe zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains
2. Klicke auf `helvenda.ch` → "Edit"
3. Vercel zeigt dir die benötigten DNS-Einträge an

**Typische DNS-Einträge für Vercel:**

#### Für `helvenda.ch` (Root Domain):
- **Typ:** `A` Record
- **Name:** `@` oder `helvenda.ch`
- **Wert:** `76.76.21.21` (Vercel IP - kann variieren, prüfe in Vercel!)

ODER

- **Typ:** `CNAME` Record
- **Name:** `@` oder `helvenda.ch`
- **Wert:** `cname.vercel-dns.com`

#### Für `www.helvenda.ch`:
- **Typ:** `CNAME` Record
- **Name:** `www`
- **Wert:** `cname.vercel-dns.com`

### Schritt 2: DNS-Einträge bei deinem Domain-Provider konfigurieren

**Wichtig:** Du musst diese Einträge bei deinem Domain-Registrar (z.B. Hostpoint, Switch, GoDaddy, etc.) hinzufügen.

#### Beispiel für Hostpoint/Switch (Schweizer Provider):

1. Logge dich in dein Domain-Verwaltungs-Panel ein
2. Gehe zu DNS-Verwaltung / DNS-Einstellungen
3. Füge folgende Einträge hinzu:

```
Typ: A
Name: @
Wert: 76.76.21.21
TTL: 3600

Typ: CNAME
Name: www
Wert: cname.vercel-dns.com
TTL: 3600
```

**WICHTIG:**
- Wenn dein Provider keine `@` als Name unterstützt, verwende `helvenda.ch` oder lasse das Feld leer
- Die IP-Adresse kann variieren - verwende die, die Vercel dir anzeigt!

### Schritt 3: DNS-Propagierung prüfen

Nach dem Hinzufügen der DNS-Einträge:

1. Warte 5-15 Minuten
2. Prüfe die DNS-Propagierung mit: https://www.whatsmydns.net/#A/helvenda.ch
3. Prüfe auch: https://www.whatsmydns.net/#CNAME/www.helvenda.ch

### Schritt 4: Domain in Vercel verifizieren

1. Gehe zurück zu: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/settings/domains
2. Klicke auf "Refresh" bei `helvenda.ch`
3. Warte auf die Verifizierung (kann einige Minuten dauern)

### Schritt 5: SSL-Zertifikat abwarten

Nach erfolgreicher DNS-Verifizierung:
- Vercel erstellt automatisch ein SSL-Zertifikat
- Dauer: 1-24 Stunden
- Status prüfen: In der Domain-Liste sollte "Valid Configuration" erscheinen

## 🔍 Troubleshooting

### Problem: "Invalid Configuration" bleibt bestehen

**Lösung 1: DNS-Einträge nochmal prüfen**
- Stelle sicher, dass die Einträge exakt so sind, wie Vercel sie angibt
- Prüfe Tippfehler
- Stelle sicher, dass keine alten/konfliktierenden Einträge vorhanden sind

**Lösung 2: Domain entfernen und neu hinzufügen**
1. Entferne `helvenda.ch` und `www.helvenda.ch` aus Vercel
2. Warte 5 Minuten
3. Füge die Domains erneut hinzu
4. Folge den neuen DNS-Anweisungen

**Lösung 3: Nameserver auf Vercel umstellen (Alternative)**
Wenn du Wildcard-Subdomains brauchst oder Probleme mit DNS-Einträgen hast:

1. Ändere die Nameserver bei deinem Domain-Provider zu:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

2. Vercel verwaltet dann alle DNS-Einträge automatisch

### Problem: Domain funktioniert nicht nach Verifizierung

**Prüfe:**
1. Sind die Umgebungsvariablen korrekt gesetzt?
   - `NEXTAUTH_URL` = `https://helvenda.ch`
   - `NEXT_PUBLIC_BASE_URL` = `https://helvenda.ch`
   - `NEXT_PUBLIC_APP_URL` = `https://helvenda.ch`

2. Ist ein Deployment erfolgreich?
   - Prüfe: https://vercel.com/lucas-rodrigues-projects-1afdcdc5/helvenda/deployments

3. Ist die Domain dem Production-Branch zugeordnet?
   - In Vercel → Domains → Edit → "Production" auswählen

## 📝 Checkliste

- [ ] DNS-Einträge bei Domain-Provider hinzugefügt
- [ ] DNS-Propagierung geprüft (whatsmydns.net)
- [ ] Domain in Vercel verifiziert ("Refresh" geklickt)
- [ ] SSL-Zertifikat aktiv (Status: "Valid Configuration")
- [ ] Umgebungsvariablen aktualisiert
- [ ] Deployment erfolgreich
- [ ] Domain funktioniert im Browser (https://helvenda.ch)

## 🆘 Support

Falls das Problem weiterhin besteht:
1. Prüfe die Vercel-Dokumentation: https://vercel.com/docs/concepts/projects/domains
2. Kontaktiere Vercel Support über das Dashboard
3. Prüfe die Vercel-Logs für Fehlermeldungen

