# 🔍 TWINT in Stripe aktivieren - Prüfung

## Wichtige Information

**TWINT und Kreditkarte verwenden beide den GLEICHEN Stripe Account!**

Beide Zahlungsmethoden nutzen:
- Den gleichen `STRIPE_SECRET_KEY`
- Den gleichen `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Den gleichen Stripe Account

## Unterschiede

### Kreditkarte
- ✅ Funktioniert standardmäßig in allen Stripe-Accounts
- ✅ Keine zusätzliche Aktivierung nötig
- ✅ Funktioniert weltweit

### TWINT
- ⚠️ Nur für **Schweizer Stripe-Accounts** verfügbar
- ⚠️ Muss in Stripe Dashboard **aktiviert** werden
- ⚠️ Erfordert spezielle Konfiguration

## Prüfung: Ist TWINT aktiviert?

### Schritt 1: Stripe Dashboard öffnen

1. Gehen Sie zu: **https://dashboard.stripe.com**
2. Loggen Sie sich mit Ihrem Score-Max Account ein

### Schritt 2: Payment Methods prüfen

1. Im Stripe Dashboard: Klicken Sie auf **"Settings"** (Einstellungen)
2. Klicken Sie auf **"Payment methods"** (Zahlungsmethoden)
3. Scrollen Sie zu **"TWINT"**

### Schritt 3: TWINT Status prüfen

Sie sehen einen von drei Status:

#### ✅ Status 1: "Activated" (Aktiviert)
- TWINT ist aktiviert und funktioniert
- Sie können TWINT-Zahlungen akzeptieren

#### ⚠️ Status 2: "Available" (Verfügbar)
- TWINT ist verfügbar, aber noch nicht aktiviert
- Klicken Sie auf **"Activate"** um TWINT zu aktivieren

#### ❌ Status 3: "Not available" (Nicht verfügbar)
- TWINT ist für Ihren Account nicht verfügbar
- **Mögliche Gründe:**
  - Account ist nicht in der Schweiz registriert
  - Account-Typ unterstützt TWINT nicht
  - Account-Verifizierung nicht abgeschlossen

## TWINT aktivieren (falls nicht aktiviert)

1. Im Stripe Dashboard: **Settings** → **Payment methods**
2. Scrollen Sie zu **TWINT**
3. Klicken Sie auf **"Activate"**
4. Folgen Sie den Anweisungen
5. Möglicherweise müssen Sie:
   - Account-Verifizierung abschließen
   - Geschäftsinformationen aktualisieren
   - Schweizer Adresse bestätigen

## Prüfung: Account-Land

TWINT ist nur für Schweizer Accounts verfügbar:

1. Im Stripe Dashboard: **Settings** → **Account**
2. Prüfen Sie das **"Country"** Feld
3. Muss **"Switzerland"** oder **"Schweiz"** sein

## Test: TWINT-Zahlung testen

Nach der Aktivierung:

1. Gehen Sie zu: `http://localhost:3002/my-watches/selling/fees`
2. Klicken Sie auf **"Jetzt bezahlen"** bei einer Rechnung
3. Wählen Sie **"TWINT"** als Zahlungsmethode
4. Sie sollten das TWINT-Zahlungsformular sehen

## Troubleshooting

### Problem: TWINT wird nicht angezeigt

**Lösung:**
1. Prüfen Sie, ob TWINT in Stripe aktiviert ist
2. Prüfen Sie, ob Ihr Account in der Schweiz registriert ist
3. Prüfen Sie die Stripe Dashboard Logs

### Problem: "TWINT is not available for your account"

**Lösung:**
1. Account-Land muss Schweiz sein
2. Account muss vollständig verifiziert sein
3. Kontaktieren Sie Stripe Support falls nötig

### Problem: TWINT funktioniert, aber Kreditkarte nicht

**Lösung:**
- Das sollte nicht passieren - beide nutzen den gleichen Account
- Prüfen Sie die API Keys erneut
- Prüfen Sie die Stripe Dashboard Logs

## Zusammenfassung

- ✅ **Kreditkarte:** Funktioniert standardmäßig
- ⚠️ **TWINT:** Muss in Stripe aktiviert werden (nur Schweiz)
- 🔑 **Beide:** Verwenden die gleichen Stripe Keys
- 📍 **Wichtig:** Account muss in der Schweiz sein für TWINT

