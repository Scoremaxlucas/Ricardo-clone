# Helvenda Zahlungsschutz - Just-in-Time Stripe Connect Onboarding

## Übersicht

Diese Implementierung ermöglicht es Verkäufern, den Helvenda Zahlungsschutz bei Inseraten zu aktivieren, **ohne vorher** ein Stripe Connect Onboarding abzuschliessen. Das Onboarding wird erst benötigt, wenn eine Auszahlung ansteht.

## Wichtige Konzepte

### Just-in-Time Onboarding

- Verkäufer können Inserate mit Zahlungsschutz erstellen ohne Onboarding
- Onboarding wird nur benötigt wenn:
  - Ein geschützter Verkauf stattgefunden hat UND
  - Die Auszahlung ansteht
- Keine Stripe-Erwähnungen in der UI (Helvenda-Wording)

### Helvenda-Wording (Keine Stripe-Erwähnung)

| Statt | Verwende |
|-------|----------|
| Stripe Account | Auszahlungsdaten |
| Stripe Onboarding | Auszahlung einrichten |
| Stripe Connect | (nicht erwähnen) |
| Bank Account verbinden | Bankkonto hinzufügen |

## Datenmodell

### User (neue Felder)

```prisma
connectOnboardingStatus String @default("NOT_STARTED") // NOT_STARTED, INCOMPLETE, COMPLETE
payoutsEnabled Boolean @default(false)
```

### Bestehende User-Felder (unverändert)

```prisma
stripeConnectedAccountId String?
stripeOnboardingComplete Boolean @default(false)
stripeOnboardingLinkExpiresAt DateTime?
```

### Order paymentStatus (erweitert)

Neuer Status: `release_pending_onboarding` - Auszahlung wartet auf Verkäufer-Onboarding

## API Endpoints

### 1. Ensure Account
`GET/POST /api/stripe/connect/ensure-account`

- GET: Holt aktuellen Onboarding-Status
- POST: Erstellt Stripe Connected Account falls nötig, gibt Status zurück

Response:
```json
{
  "hasAccount": true,
  "accountId": "acct_xxx",
  "status": "NOT_STARTED" | "INCOMPLETE" | "COMPLETE",
  "payoutsEnabled": true,
  "onboardingComplete": true
}
```

### 2. Account Link (Onboarding URL)
`POST /api/stripe/connect/account-link`

Erstellt Onboarding-Link für Verkäufer.

Request:
```json
{
  "return_to": "/my-watches/account" // Optional
}
```

Response:
```json
{
  "success": true,
  "url": "https://connect.stripe.com/setup/...",
  "expiresAt": 1234567890
}
```

### 3. Process Pending Payouts
`GET/POST /api/stripe/connect/process-pending-payouts`

- GET: Zählt ausstehende Auszahlungen
- POST: Verarbeitet alle ausstehenden Auszahlungen für den Verkäufer

## Ablauf

### 1. Verkäufer erstellt Inserat mit Zahlungsschutz

1. Inserat erstellen → `paymentProtectionEnabled = true`
2. Kein Onboarding erforderlich
3. UI zeigt Hinweis: "Für Auszahlungen brauchst du einmalig Auszahlungsdaten"

### 2. Käufer kauft und bezahlt

1. Zahlung via Stripe Checkout
2. Geld wird auf Helvenda Platform gehalten
3. Order Status: `PAID_HELD` (paymentStatus: `paid`)

### 3. Käufer bestätigt Erhalt

1. Käufer klickt "Erhalt bestätigen"
2. System versucht `releaseFunds(orderId)`
3. Wenn Verkäufer onboarded → Transfer erfolgt
4. Wenn Verkäufer NICHT onboarded → Order wird `release_pending_onboarding`

### 4. Verkäufer richtet Auszahlung ein

1. Verkäufer erhält Notification: "Auszahlung ausstehend"
2. Verkäufer geht zu Kontoeinstellungen
3. Klickt "Auszahlung einrichten"
4. Wird zu Stripe Onboarding weitergeleitet
5. Nach Abschluss: Webhook `account.updated` → Status wird `COMPLETE`

### 5. Ausstehende Auszahlungen werden verarbeitet

1. Webhook erkennt abgeschlossenes Onboarding
2. System benachrichtigt Verkäufer über bereite Auszahlungen
3. Verkäufer kann "Auszahlungen verarbeiten" klicken
4. Oder: Auto-Release Job verarbeitet ausstehende Orders

## UI Komponenten

### StripePayoutSection (`/components/account/StripePayoutSection.tsx`)

Zeigt in Kontoeinstellungen:
- Aktuellen Onboarding-Status
- Ausstehende Auszahlungen (Anzahl + Betrag)
- CTA: "Auszahlung einrichten" oder "Einrichtung fortsetzen"
- Info über Helvenda Zahlungsschutz

### StepShippingPayment (Inserat-Wizard)

- Checkbox für Zahlungsschutz (wie bisher)
- NEU: Nicht-blockierender Hinweis wenn Onboarding fehlt
- Link zu Kontoeinstellungen

## Webhook Handling

### account.updated

1. Prüft ob Onboarding abgeschlossen
2. Aktualisiert User: `connectOnboardingStatus`, `payoutsEnabled`
3. Wenn neu abgeschlossen:
   - Benachrichtigt Verkäufer
   - Prüft auf ausstehende Auszahlungen
   - Benachrichtigt über bereite Auszahlungen

## Sicherheit & Business Rules

1. `paymentProtectionEnabled` ist immutable nach Veröffentlichung
2. Auszahlung nur wenn:
   - Käufer Erhalt bestätigt ODER
   - Auto-Release Timeout abgelaufen ODER
   - Admin-Freigabe
3. Dispute blockiert Auszahlung
4. Alle Transfer-Aktionen geloggt

## Migration

SQL Migration in `/prisma/migrations/20250621_add_connect_onboarding_status/`:
- Fügt `connectOnboardingStatus` und `payoutsEnabled` hinzu
- Migriert bestehende User mit abgeschlossenem Onboarding

## Testing

1. Erstelle Inserat mit Zahlungsschutz ohne Onboarding
2. Simuliere Kauf und Zahlung
3. Bestätige Erhalt als Käufer
4. Verifiziere Order ist `release_pending_onboarding`
5. Führe Onboarding als Verkäufer durch
6. Verifiziere Auszahlung erfolgt

## Offene Punkte

- [ ] E-Mail-Benachrichtigung bei ausstehender Auszahlung
- [ ] Admin-Dashboard für ausstehende Onboardings
- [ ] Timeout-Warnung wenn Onboarding lange aussteht
