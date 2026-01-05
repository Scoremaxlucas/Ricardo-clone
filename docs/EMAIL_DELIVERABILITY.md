# E-Mail Deliverability Guide - Verhindern von Spam/Junk

## Problem
E-Mails von `noreply@helvenda.ch` landen im Spam-Ordner.

## Lösung: DNS-Records konfigurieren

### Schritt 1: Domain bei Resend verifizieren

1. Gehe zu https://resend.com/domains
2. Klicke "Add Domain"
3. Gib `helvenda.ch` ein
4. Klicke "Add"

Resend zeigt dir dann die DNS-Records, die du hinzufügen musst.

### Schritt 2: DNS-Records hinzufügen

Füge diese Records bei deinem Domain-Provider hinzu:

#### 1. SPF Record (Sender Policy Framework)
```
Type:   TXT
Name:   @
Value:  v=spf1 include:resend.com ~all
TTL:    3600
```

**Was es macht:** Teilt E-Mail-Servern mit, dass Resend berechtigt ist, E-Mails für helvenda.ch zu senden.

#### 2. DKIM Record (DomainKeys Identified Mail)
```
Type:   TXT
Name:   resend._domainkey
Value:  [Von Resend bereitgestellt - siehe resend.com/domains]
TTL:    3600
```

**Was es macht:** Digitale Signatur, die beweist, dass die E-Mail wirklich von helvenda.ch kommt.

#### 3. DMARC Record (Domain-based Message Authentication)
```
Type:   TXT
Name:   _dmarc
Value:  v=DMARC1; p=none; rua=mailto:dmarc@helvenda.ch
TTL:    3600
```

**Was es macht:** Teilt E-Mail-Servern mit, wie sie mit nicht authentifizierten E-Mails umgehen sollen.

**DMARC Policy-Optionen:**
- `p=none` - Nur überwachen (für Start empfohlen)
- `p=quarantine` - In Spam verschieben (nach 2 Wochen)
- `p=reject` - Ablehnen (nach 1 Monat)

### Schritt 3: Warten auf Verifizierung

- DNS-Propagierung dauert 5-15 Minuten
- Resend prüft automatisch
- Status auf https://resend.com/domains prüfen
- ✅ Grüner Haken = Verifiziert

### Schritt 4: Environment Variables aktualisieren

In `.env` oder Vercel Environment Variables:

```bash
# From-Adresse mit Display-Name (verbessert Deliverability)
RESEND_FROM_EMAIL=Helvenda <hello@helvenda.ch>

# Reply-To Adresse (wichtig für Spam-Filter)
RESEND_REPLY_TO=support@helvenda.ch

# API Key (unverändert)
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**Wichtig:** Verwende `hello@helvenda.ch` oder `info@helvenda.ch` statt `noreply@helvenda.ch` - "noreply" wird oft als Spam-Indikator gewertet.

### Schritt 5: Vercel neu deployen

```bash
vercel --prod
```

Oder in Vercel Dashboard: Redeploy

## Testen

### 1. Mail-Tester (Spam-Score)
1. Gehe zu https://www.mail-tester.com/
2. Notiere die angezeigte E-Mail-Adresse
3. Sende eine Test-E-Mail an diese Adresse
4. Klicke "Then check your score"
5. **Ziel: Score 8-10/10**

### 2. DNS-Records prüfen
- SPF: https://mxtoolbox.com/spf.aspx
- DKIM: https://mxtoolbox.com/dkim.aspx
- DMARC: https://mxtoolbox.com/dmarc.aspx

Gib `helvenda.ch` ein und prüfe ob alle Records korrekt sind.

### 3. Gmail Postmaster Tools
1. Gehe zu https://postmaster.google.com/
2. Füge `helvenda.ch` hinzu
3. Überwache:
   - Domain Reputation
   - IP Reputation
   - Authentication Rate

## Checkliste

- [ ] Domain bei Resend hinzugefügt
- [ ] SPF Record hinzugefügt
- [ ] DKIM Record hinzugefügt (von Resend)
- [ ] DMARC Record hinzugefügt (p=none)
- [ ] Domain bei Resend verifiziert (grüner Haken)
- [ ] RESEND_FROM_EMAIL auf `Helvenda <hello@helvenda.ch>` geändert
- [ ] RESEND_REPLY_TO auf `support@helvenda.ch` gesetzt
- [ ] Vercel neu deployed
- [ ] Mail-Tester Score ≥8/10
- [ ] Nach 2 Wochen: DMARC auf `p=quarantine` ändern

## Häufige Probleme

### E-Mails landen immer noch im Spam
1. Prüfe Mail-Tester Score
2. Prüfe DNS-Records mit MXToolbox
3. Warte 24-48h nach DNS-Änderungen

### DKIM-Verifizierung schlägt fehl
1. Prüfe ob der Record korrekt kopiert wurde
2. Entferne Anführungszeichen wenn vorhanden
3. Warte 15 Minuten und versuche erneut

### SPF-Fehler
1. Du kannst nur EINEN SPF-Record haben
2. Falls bereits ein SPF-Record existiert, füge `include:resend.com` hinzu:
   ```
   v=spf1 include:resend.com include:andere.com ~all
   ```

## Langfristige Tipps

### Domain Reputation aufbauen
- Starte mit wenigen E-Mails pro Tag
- Steigere langsam: 10 → 50 → 100 → 500
- Sende nur an Nutzer die sich registriert haben

### Engagement überwachen
- Öffnungsrate: Ziel >20%
- Klickrate: Ziel >5%
- Spam-Beschwerden: Ziel <0.1%

### Bounce Management
- Hard Bounces sofort entfernen
- Soft Bounces nach 3 Versuchen entfernen

## Links

- Resend Domains: https://resend.com/domains
- Mail Tester: https://www.mail-tester.com/
- Gmail Postmaster: https://postmaster.google.com/
- MXToolbox: https://mxtoolbox.com/
- Resend Docs: https://resend.com/docs
