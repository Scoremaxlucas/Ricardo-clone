# 📱 TWINT Einrichtung - Schritt für Schritt

## Übersicht

TWINT wird über **Stripe** abgewickelt, was automatische Bestätigung ermöglicht. Sie müssen Stripe konfigurieren, um TWINT-Zahlungen zu akzeptieren.

---

## Schritt 1: Stripe Account erstellen

1. Gehen Sie zu: **https://stripe.com**
2. Klicken Sie auf **"Sign up"** (oben rechts)
3. Registrieren Sie sich mit Ihrer E-Mail-Adresse
4. Bestätigen Sie Ihre E-Mail-Adresse
5. Füllen Sie die Account-Details aus:
   - **Land:** Schweiz
   - **Geschäftstyp:** Wählen Sie den passenden Typ
   - **Geschäftsname:** Helvenda (oder Ihr Geschäftsname)

---

## Schritt 2: Stripe Dashboard öffnen

1. Nach der Registrierung werden Sie automatisch zum **Stripe Dashboard** weitergeleitet
2. Falls nicht: Gehen Sie zu **https://dashboard.stripe.com**

---

## Schritt 3: Stripe API Keys holen

### 3.1 Test-Modus (für Entwicklung)

1. Im Stripe Dashboard: Klicken Sie auf **"Developers"** (links im Menü)
2. Klicken Sie auf **"API keys"**
3. Stellen Sie sicher, dass **"Test mode"** aktiviert ist (Toggle oben rechts)
4. Sie sehen zwei Keys:
   - **Publishable key** (beginnt mit `pk_test_...`)
   - **Secret key** (beginnt mit `sk_test_...`)

### 3.2 Live-Modus (für Produktion)

1. Schalten Sie **"Test mode"** aus (Toggle oben rechts)
2. Klicken Sie auf **"Reveal test key"** → **"Reveal live key"**
3. Kopieren Sie die **Live Keys**:
   - **Publishable key** (beginnt mit `pk_live_...`)
   - **Secret key** (beginnt mit `sk_live_...`)

⚠️ **WICHTIG:**

- Verwenden Sie **Test Keys** für Entwicklung
- Verwenden Sie **Live Keys** nur für Produktion
- Teilen Sie **NIEMALS** Ihren Secret Key öffentlich!

---

## Schritt 4: TWINT in Stripe aktivieren

TWINT ist standardmäßig in Stripe verfügbar, wenn Sie einen Schweizer Account haben. Falls nicht:

1. Im Stripe Dashboard: Gehen Sie zu **"Settings"** → **"Payment methods"**
2. Scrollen Sie zu **"TWINT"**
3. Klicken Sie auf **"Activate"** (falls noch nicht aktiviert)
4. Folgen Sie den Anweisungen zur Aktivierung

**Hinweis:** TWINT ist nur für Schweizer Stripe-Accounts verfügbar.

---

## Schritt 5: Environment Variables setzen

### 5.1 Öffnen Sie die `.env` Datei

```bash
# Im Projekt-Verzeichnis
nano .env
# oder
code .env
```

### 5.2 Fügen Sie die Stripe Keys hinzu

Fügen Sie am Ende der `.env` Datei hinzu:

```env
# Stripe Configuration (für TWINT)
STRIPE_SECRET_KEY=sk_test_IHR_SECRET_KEY_HIER
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_IHR_PUBLISHABLE_KEY_HIER
```

**Ersetzen Sie:**

- `sk_test_IHR_SECRET_KEY_HIER` mit Ihrem **Secret Key** aus Stripe
- `pk_test_IHR_PUBLISHABLE_KEY_HIER` mit Ihrem **Publishable Key** aus Stripe

**Beispiel:**

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

---

## Schritt 6: Server neu starten

Nach dem Hinzufügen der Environment Variables müssen Sie den Server neu starten:

```bash
# Stoppen Sie den aktuellen Server (Ctrl+C)
# Dann starten Sie ihn neu:
npm run dev
```

---

## Schritt 7: TWINT testen

### 7.1 Test-Zahlung durchführen

1. Gehen Sie zu einer Rechnung: `/my-watches/selling/fees`
2. Klicken Sie auf **"Zahlen"** bei einer Rechnung
3. Wählen Sie **"TWINT"** als Zahlungsmethode
4. Sie sollten jetzt das TWINT-Zahlungsformular sehen

### 7.2 Test mit Stripe Test-Karten

Für TWINT können Sie keine Test-Karten verwenden. Sie müssen eine echte TWINT-App verwenden, aber im **Test-Modus** wird keine echte Zahlung durchgeführt.

**Stripe Test-Modus für TWINT:**

- Verwenden Sie eine echte TWINT-App
- Die Zahlung wird im Test-Modus simuliert
- Keine echten Gelder werden transferiert

### 7.3 Webhook konfigurieren (optional, für automatische Bestätigung)

Für automatische Bestätigung von TWINT-Zahlungen:

1. Im Stripe Dashboard: Gehen Sie zu **"Developers"** → **"Webhooks"**
2. Klicken Sie auf **"Add endpoint"**
3. **Endpoint URL:** `https://ihre-domain.ch/api/stripe/webhook`
4. **Events to send:** Wählen Sie:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Klicken Sie auf **"Add endpoint"**
6. Kopieren Sie den **Signing secret** (beginnt mit `whsec_...`)

Fügen Sie den Signing Secret zur `.env` hinzu:

```env
STRIPE_WEBHOOK_SECRET=whsec_IHR_WEBHOOK_SECRET_HIER
```

---

## Schritt 8: Produktion (Live-Modus)

Wenn Sie bereit für Produktion sind:

1. **Stripe Account verifizieren:**
   - Gehen Sie zu **"Settings"** → **"Account"**
   - Füllen Sie alle erforderlichen Informationen aus
   - Verifizieren Sie Ihr Geschäft

2. **Live Keys verwenden:**
   - Aktualisieren Sie die `.env` Datei mit **Live Keys**
   - Verwenden Sie `pk_live_...` und `sk_live_...`

3. **Webhook für Produktion:**
   - Erstellen Sie einen neuen Webhook-Endpoint mit Ihrer Produktions-URL
   - Verwenden Sie den Live Webhook Secret

---

## Troubleshooting

### Problem: TWINT wird nicht angezeigt

**Lösung:**

1. Prüfen Sie, ob Stripe Keys in `.env` gesetzt sind
2. Prüfen Sie, ob der Server neu gestartet wurde
3. Prüfen Sie die Browser-Konsole auf Fehler

### Problem: "Stripe ist nicht konfiguriert"

**Lösung:**

1. Prüfen Sie die `.env` Datei:
   ```bash
   cat .env | grep STRIPE
   ```
2. Stellen Sie sicher, dass die Keys korrekt sind (keine Leerzeichen, vollständig)
3. Starten Sie den Server neu

### Problem: TWINT-Zahlung schlägt fehl

**Lösung:**

1. Prüfen Sie die Stripe Dashboard Logs: **"Developers"** → **"Logs"**
2. Prüfen Sie die Server-Logs im Terminal
3. Stellen Sie sicher, dass TWINT in Stripe aktiviert ist

### Problem: Webhook funktioniert nicht

**Lösung:**

1. Prüfen Sie die Webhook-URL in Stripe Dashboard
2. Stellen Sie sicher, dass die URL öffentlich erreichbar ist
3. Prüfen Sie die Webhook-Logs in Stripe Dashboard

---

## Nützliche Links

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Dokumentation:** https://stripe.com/docs
- **TWINT in Stripe:** https://stripe.com/docs/payments/twint
- **Stripe Test Cards:** https://stripe.com/docs/testing

---

## Zusammenfassung Checkliste

- [ ] Stripe Account erstellt
- [ ] Stripe API Keys kopiert (Test-Modus)
- [ ] TWINT in Stripe aktiviert
- [ ] Environment Variables gesetzt (`.env`)
- [ ] Server neu gestartet
- [ ] TWINT-Zahlung getestet
- [ ] Webhook konfiguriert (optional)
- [ ] Für Produktion: Live Keys gesetzt

---

**Fertig!** 🎉 TWINT sollte jetzt funktionieren!
