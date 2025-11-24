# Stripe Konfiguration für Direktzahlung

## 📋 Übersicht

Die Direktzahlung wurde mit Stripe implementiert. Benutzer können Rechnungen direkt mit Kreditkarte bezahlen.

## 🔧 Konfiguration

### 1. Stripe Account erstellen

1. Gehen Sie zu [stripe.com](https://stripe.com)
2. Erstellen Sie ein Konto
3. Aktivieren Sie das Konto (Verifizierung erforderlich)

### 2. API Keys holen

1. Gehen Sie zu [Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys)
2. Kopieren Sie:
   - **Publishable key** (für Frontend)
   - **Secret key** (für Backend)

### 3. Environment Variables setzen

Fügen Sie folgende Variablen zu Ihrer `.env` Datei hinzu:

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Wichtig:**
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` muss mit `NEXT_PUBLIC_` beginnen (wird im Browser verwendet)
- `STRIPE_SECRET_KEY` darf **NICHT** mit `NEXT_PUBLIC_` beginnen (nur Server-seitig)
- `STRIPE_WEBHOOK_SECRET` wird für Webhook-Verifizierung benötigt

### 4. Webhook einrichten

#### Lokale Entwicklung (Stripe CLI)

1. Installieren Sie die [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login:
   ```bash
   stripe login
   ```
3. Webhook weiterleiten:
   ```bash
   stripe listen --forward-to localhost:3002/api/stripe/webhook
   ```
4. Kopieren Sie den `whsec_...` Secret und fügen Sie es zu `.env` hinzu

#### Produktion

1. Gehen Sie zu [Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Klicken Sie auf "Add endpoint"
3. Endpoint URL: `https://ihre-domain.ch/api/stripe/webhook`
4. Events auswählen:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Kopieren Sie den "Signing secret" (`whsec_...`) und fügen Sie es zu `.env` hinzu

## 🧪 Testing

### Test-Kreditkarten

Stripe bietet Test-Kreditkarten für Entwicklung:

| Karte | Ergebnis |
|-------|----------|
| `4242 4242 4242 4242` | Erfolgreich |
| `4000 0000 0000 0002` | Fehlgeschlagen |
| `4000 0000 0000 9995` | 3D Secure erforderlich |

**Weitere Test-Karten:** [Stripe Testing](https://stripe.com/docs/testing)

### Test-Modus vs. Live-Modus

- **Test-Modus:** Verwendet `pk_test_...` und `sk_test_...`
- **Live-Modus:** Verwendet `pk_live_...` und `sk_live_...`

**Wichtig:** Wechseln Sie nur zu Live-Modus, wenn Sie bereit für Produktion sind!

## 📊 Zahlungsfluss

1. **Benutzer klickt "Jetzt bezahlen"**
   - Frontend ruft `/api/invoices/[id]/create-payment-intent` auf
   - Backend erstellt Stripe Payment Intent
   - Frontend erhält `clientSecret`

2. **Benutzer gibt Zahlungsdaten ein**
   - Stripe Elements sammelt Zahlungsdaten sicher
   - Frontend sendet Zahlung an Stripe

3. **Stripe verarbeitet Zahlung**
   - Stripe validiert Zahlung
   - Bei Erfolg: Webhook wird gesendet

4. **Webhook verarbeitet Zahlung**
   - `/api/stripe/webhook` empfängt Event
   - Rechnung wird als bezahlt markiert
   - Konto wird entsperrt (falls gesperrt)
   - Benachrichtigung wird erstellt

## 🔒 Sicherheit

- **PCI Compliance:** Stripe ist PCI-DSS zertifiziert
- **Kreditkartendaten:** Werden nie auf unseren Servern gespeichert
- **Webhook-Verifizierung:** Signatur wird bei jedem Webhook geprüft
- **HTTPS:** Erforderlich für Produktion

## 🐛 Troubleshooting

### "Stripe ist nicht konfiguriert"
- Prüfen Sie ob `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` gesetzt ist
- Server neu starten nach `.env` Änderungen

### "Webhook signature verification failed"
- Prüfen Sie ob `STRIPE_WEBHOOK_SECRET` korrekt ist
- Webhook Secret muss mit `whsec_` beginnen

### Zahlung wird nicht bestätigt
- Prüfen Sie Webhook-Logs in Stripe Dashboard
- Prüfen Sie Server-Logs für Fehler
- Stellen Sie sicher, dass Webhook-Endpoint erreichbar ist

## 📚 Weitere Ressourcen

- [Stripe Dokumentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)





