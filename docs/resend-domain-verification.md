# Resend Domain-Verifizierung - WICHTIG!

## Problem

Resend erlaubt im **Testmodus** nur E-Mails an Ihre **eigene E-Mail-Adresse** (die mit der Sie sich bei Resend registriert haben).

**Erlaubt:**

- ✅ `lucasrodrigues.gafner@outlook.com` (Ihre Resend-Registrierungs-E-Mail)

**Blockiert:**

- ❌ `Lucas.helvenda@outlook.com` (andere E-Mail-Adressen)
- ❌ Alle anderen E-Mail-Adressen

**Fehlermeldung:**

```
You can only send testing emails to your own email address.
To send emails to other recipients, please verify a domain at resend.com/domains
```

## Lösung: Domain verifizieren

### Schritt 1: Domain bei Resend hinzufügen

1. Gehen Sie zu: **https://resend.com/domains**
2. Klicken Sie auf **"Add Domain"**
3. Geben Sie Ihre Domain ein (z.B. `helvenda.ch` oder `helvenda.com`)
4. Klicken Sie auf **"Add"**

### Schritt 2: DNS-Records hinzufügen

Resend zeigt Ihnen DNS-Records, die Sie zu Ihrer Domain hinzufügen müssen:

**Beispiel DNS-Records:**

```
Type: TXT
Name: @
Value: v=spf1 include:resend.com ~all

Type: TXT
Name: resend._domainkey
Value: [DKIM Record von Resend]

Type: CNAME
Name: resend
Value: [CNAME Record von Resend]
```

**So fügen Sie DNS-Records hinzu:**

1. Loggen Sie sich bei Ihrem Domain-Provider ein (z.B. Namecheap, GoDaddy, etc.)
2. Gehen Sie zu DNS-Verwaltung
3. Fügen Sie die Records hinzu
4. Speichern Sie

### Schritt 3: Warten auf Verifizierung

- Resend prüft automatisch die DNS-Records
- Verifizierung dauert meist **5-15 Minuten**
- Sie erhalten eine E-Mail wenn die Domain verifiziert ist

### Schritt 4: .env aktualisieren

Nach der Verifizierung aktualisieren Sie `.env`:

```bash
RESEND_API_KEY=re_CFVqCjev_4FHbAek8Q5viebz9YrXCKqG9
RESEND_FROM_EMAIL=noreply@ihre-domain.ch
```

**Wichtig:** Ersetzen Sie `ihre-domain.ch` mit Ihrer verifizierten Domain!

### Schritt 5: Server neu starten

```bash
npm run dev
```

## Alternative: Test mit eigener E-Mail

Für Tests können Sie sich mit `lucasrodrigues.gafner@outlook.com` registrieren - diese E-Mail funktioniert ohne Domain-Verifizierung.

## Zusammenfassung

**Für Entwicklung/Test:**

- Verwenden Sie `lucasrodrigues.gafner@outlook.com` (funktioniert ohne Domain)

**Für Produktion:**

- Domain bei Resend verifizieren
- `RESEND_FROM_EMAIL` auf `noreply@ihre-domain.ch` setzen
- Alle E-Mail-Adressen funktionieren dann

## Hilfe

- Resend Docs: https://resend.com/docs
- Domain Setup: https://resend.com/domains
- Support: support@resend.com
