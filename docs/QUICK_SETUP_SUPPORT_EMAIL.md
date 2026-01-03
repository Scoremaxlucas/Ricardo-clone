# Schnell-Setup für support@helvenda.ch

## Automatisiertes Setup

Führen Sie einfach aus:

```bash
npm run setup:support-email
```

Das Script führt Sie durch alle Schritte!

## Manuelle Schritte (falls nötig)

### 1. Domain in Resend verifizieren

1. **Gehen Sie zu**: https://resend.com/domains
2. **Klicken Sie auf**: "Add Domain"
3. **Geben Sie ein**: `helvenda.ch`
4. **Fügen Sie die 3 DNS-Records hinzu**, die Resend zeigt:
   - SPF (TXT)
   - DKIM (TXT)
   - CNAME
5. **Warten Sie** 5-15 Minuten auf Verifizierung

### 2. Vercel Environment Variable

1. **Vercel Dashboard** → Project → Settings → Environment Variables
2. **Hinzufügen**:
   ```
   Name: RESEND_FROM_EMAIL
   Value: support@helvenda.ch
   ```
3. **Alle Environments** auswählen
4. **Save**

### 3. Cloudflare Email Routing (für E-Mail-Empfang)

1. **Cloudflare Dashboard** → Email → Email Routing
2. **Aktivieren** für `helvenda.ch`
3. **MX Records hinzufügen** (2 Records von Cloudflare)
4. **Destination Address** erstellen (Ihre persönliche E-Mail)
5. **Routing Rule** erstellen: `support@helvenda.ch` → Ihre E-Mail

### 4. Testen

Senden Sie eine E-Mail an `support@helvenda.ch` und prüfen Sie, ob sie ankommt.

## Fertig! 🎉

Jetzt können Sie auf die Stripe-E-Mail antworten!
