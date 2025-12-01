# 📱 TWINT in Stripe aktivieren - Schritt für Schritt

## Übersicht

TWINT muss in Ihrem Stripe Dashboard aktiviert werden, damit TWINT-Zahlungen funktionieren. Diese Anleitung führt Sie durch den gesamten Prozess.

---

## Schritt 1: Stripe Dashboard öffnen

1. Gehen Sie zu: **https://dashboard.stripe.com**
2. Loggen Sie sich mit Ihrem **Score-Max Account** ein
3. Sie sollten jetzt im Stripe Dashboard sein

---

## Schritt 2: Zu Payment Methods navigieren

1. Im linken Menü: Klicken Sie auf **"Settings"** (Einstellungen)
   - Das ist das Zahnrad-Symbol ⚙️
2. In den Einstellungen: Klicken Sie auf **"Payment methods"** (Zahlungsmethoden)
   - Oder direkter Link: https://dashboard.stripe.com/settings/payment_methods

---

## Schritt 3: TWINT finden

1. Scrollen Sie durch die Liste der verfügbaren Zahlungsmethoden
2. Suchen Sie nach **"TWINT"**
3. Sie sehen einen der folgenden Status:

### Status A: "Activated" ✅

- **Bedeutung:** TWINT ist bereits aktiviert
- **Aktion:** Keine weitere Aktion nötig - TWINT funktioniert bereits!

### Status B: "Available" ⚠️

- **Bedeutung:** TWINT ist verfügbar, aber noch nicht aktiviert
- **Aktion:** Weiter zu Schritt 4

### Status C: "Not available" ❌

- **Bedeutung:** TWINT ist für Ihren Account nicht verfügbar
- **Mögliche Gründe:**
  - Account ist nicht in der Schweiz registriert
  - Account-Verifizierung nicht abgeschlossen
  - Account-Typ unterstützt TWINT nicht
- **Lösung:** Siehe "Troubleshooting" unten

---

## Schritt 4: TWINT aktivieren (falls Status B)

1. Klicken Sie auf den **"Activate"** Button neben TWINT
2. Sie werden möglicherweise aufgefordert:
   - Account-Verifizierung abzuschließen
   - Geschäftsinformationen zu aktualisieren
   - Schweizer Adresse zu bestätigen

3. **Folgen Sie den Anweisungen:**
   - Füllen Sie alle erforderlichen Felder aus
   - Bestätigen Sie Ihre Geschäftsinformationen
   - Verifizieren Sie Ihren Account falls nötig

4. Nach der Aktivierung sehen Sie:
   - Status ändert sich zu **"Activated"** ✅
   - TWINT ist jetzt verfügbar

---

## Schritt 5: Account-Land prüfen (falls TWINT nicht verfügbar)

TWINT ist nur für **Schweizer Stripe-Accounts** verfügbar:

1. Im Stripe Dashboard: **Settings** → **"Account"**
2. Prüfen Sie das **"Country"** Feld
3. Muss **"Switzerland"** oder **"Schweiz"** sein

**Falls nicht:**

- Kontaktieren Sie Stripe Support
- Oder erstellen Sie einen neuen Stripe Account mit Schweiz als Land

---

## Schritt 6: TWINT testen

Nach der Aktivierung:

1. **Server neu starten** (falls noch nicht geschehen):

   ```bash
   cd /Users/lucasrodrigues/ricardo-clone && npm run dev
   ```

2. **Im Browser testen:**
   - Gehen Sie zu: `http://localhost:3002/my-watches/selling/fees`
   - Klicken Sie auf **"Jetzt bezahlen"** bei einer Rechnung
   - Wählen Sie **"TWINT"** als Zahlungsmethode
   - Sie sollten jetzt das TWINT-Zahlungsformular sehen ✅

---

## Troubleshooting

### Problem: TWINT wird nicht angezeigt in Payment Methods

**Lösung:**

1. Prüfen Sie, ob Ihr Account in der Schweiz registriert ist
2. Prüfen Sie, ob Ihr Account vollständig verifiziert ist
3. Kontaktieren Sie Stripe Support falls nötig

### Problem: "TWINT is not available for your account"

**Lösung:**

1. **Account-Land prüfen:**
   - Settings → Account → Country
   - Muss "Switzerland" sein

2. **Account-Verifizierung:**
   - Settings → Account → Verifizierung abschließen
   - Alle erforderlichen Dokumente hochladen

3. **Stripe Support kontaktieren:**
   - Falls weiterhin Probleme: https://support.stripe.com

### Problem: TWINT ist aktiviert, aber funktioniert nicht

**Lösung:**

1. Prüfen Sie die Stripe Dashboard Logs:
   - Developers → Logs
   - Prüfen Sie auf Fehler

2. Prüfen Sie die Server-Logs:
   - Terminal wo `npm run dev` läuft
   - Prüfen Sie auf Fehler

3. Prüfen Sie die Browser-Konsole:
   - F12 → Console
   - Prüfen Sie auf JavaScript-Fehler

### Problem: "Invalid API Key" Fehler

**Lösung:**

1. Prüfen Sie die `.env` Datei:
   ```bash
   cat .env | grep STRIPE
   ```
2. Stellen Sie sicher, dass die Keys korrekt sind
3. Server neu starten:
   ```bash
   npm run dev
   ```

---

## Wichtige Hinweise

- ✅ **TWINT ist nur für Schweizer Accounts:** Account-Land muss Schweiz sein
- ✅ **Account-Verifizierung:** Möglicherweise müssen Sie Ihren Account verifizieren
- ✅ **Live vs. Test:** TWINT funktioniert sowohl im Test- als auch im Live-Modus
- ✅ **Gleiche Keys:** TWINT und Kreditkarte verwenden die gleichen Stripe Keys

---

## Nützliche Links

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Payment Methods:** https://dashboard.stripe.com/settings/payment_methods
- **Account Settings:** https://dashboard.stripe.com/settings/account
- **Stripe Support:** https://support.stripe.com
- **TWINT Dokumentation:** https://stripe.com/docs/payments/twint

---

## Checkliste

- [ ] Stripe Dashboard geöffnet
- [ ] Zu Payment Methods navigiert
- [ ] TWINT Status geprüft
- [ ] TWINT aktiviert (falls nötig)
- [ ] Account-Land ist Schweiz (falls TWINT nicht verfügbar)
- [ ] Account-Verifizierung abgeschlossen (falls nötig)
- [ ] Server neu gestartet
- [ ] TWINT-Zahlung getestet

---

**Fertig!** 🎉 Nach der Aktivierung sollte TWINT funktionieren!
