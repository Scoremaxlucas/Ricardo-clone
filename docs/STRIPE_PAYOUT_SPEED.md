# Stripe Payout Speed Configuration

## Warum dauern Auszahlungen so lange?

Es gibt mehrere Gründe für Verzögerungen bei Stripe-Auszahlungen:

### 1. **Bankfeiertage**
- Schweizer Banken sind an Feiertagen geschlossen
- Auszahlungen werden nur an Werktagen verarbeitet
- Beispiel: Weihnachten (25.-26. Dez.) verzögert Auszahlungen

### 2. **Erste Auszahlung**
- Erste Auszahlung benötigt zusätzliche Verifizierung
- Kann 7-14 Tage dauern
- Nachfolgende Auszahlungen sind schneller

### 3. **Standard Payout-Schedule**
- Standard: **Wöchentlich** (2-7 Werktage)
- Wir konfigurieren automatisch: **Täglich** (1-2 Werktage)
- Wochenenden werden standardmäßig übersprungen

## Automatische Konfiguration

Helvenda konfiguriert automatisch **tägliche Auszahlungen** für alle neuen Stripe Connect Accounts nach dem Onboarding. Dies macht Auszahlungen schneller als der Standard (wöchentlich).

## Wochenend-Auszahlungen aktivieren

### Option 1: Instant Payouts (Empfohlen für schnelle Auszahlungen)

**Vorteile:**
- ✅ Verfügbar 24/7 (auch Wochenenden und Feiertage)
- ✅ Geld innerhalb von 30 Minuten auf dem Bankkonto
- ✅ Keine Wartezeit auf Bankfeiertage

**Nachteile:**
- ❌ Zusätzliche Gebühren (~1% oder Mindestgebühr)
- ❌ Nicht für alle Banken verfügbar

**So aktivieren Sie Instant Payouts:**

1. Gehen Sie zu [Stripe Dashboard](https://dashboard.stripe.com)
2. Wählen Sie "Connect" → "Connected accounts"
3. Klicken Sie auf Ihr Connected Account
4. Gehen Sie zu "Settings" → "Payouts"
5. Aktivieren Sie "Instant payouts"
6. Bestätigen Sie die zusätzlichen Gebühren

### Option 2: Manuelle Konfiguration im Stripe Dashboard

1. Gehen Sie zu [Stripe Dashboard](https://dashboard.stripe.com)
2. Wählen Sie "Connect" → "Connected accounts"
3. Klicken Sie auf Ihr Connected Account
4. Gehen Sie zu "Settings" → "Payouts"
5. Wählen Sie "Payout schedule"
6. Konfigurieren Sie:
   - **Interval**: Daily (täglich)
   - **Delay days**: 0-2 Tage (je nach Bank)

## Aktuelle Auszahlungsgeschwindigkeit

| Methode | Geschwindigkeit | Wochenenden | Gebühren |
|---------|----------------|-------------|----------|
| Standard (wöchentlich) | 2-7 Werktage | ❌ Nein | Standard |
| **Täglich (automatisch)** | **1-2 Werktage** | ❌ Nein | Standard |
| **Instant Payouts** | **30 Minuten** | ✅ Ja | +1% oder Mindestgebühr |

## Häufige Fragen

### Warum sehe ich "Expected 5 Jan 2026" für meine Auszahlung?

Dies liegt an:
1. Bankfeiertagen (Weihnachten 25.-26. Dez.)
2. Erster Auszahlung (zusätzliche Verifizierung)
3. Standard-Schedule (wird automatisch auf täglich geändert)

### Kann ich Auszahlungen noch schneller machen?

Ja! Aktivieren Sie **Instant Payouts** im Stripe Dashboard. Dies ermöglicht Auszahlungen innerhalb von 30 Minuten, auch an Wochenenden.

### Werden Wochenend-Auszahlungen automatisch aktiviert?

Nein. Standardmäßig werden Auszahlungen nur an Werktagen verarbeitet. Für Wochenend-Auszahlungen müssen Sie **Instant Payouts** aktivieren (siehe oben).

### Gibt es zusätzliche Gebühren für schnellere Auszahlungen?

- **Tägliche Auszahlungen**: Keine zusätzlichen Gebühren ✅
- **Instant Payouts**: ~1% oder Mindestgebühr pro Auszahlung

## Technische Details

### Automatische Konfiguration

Nach erfolgreichem Stripe Connect Onboarding wird automatisch versucht, die Payout-Schedule auf "daily" zu setzen:

```typescript
// Automatisch nach Onboarding
stripe.accounts.update(accountId, {
  settings: {
    payouts: {
      schedule: {
        interval: 'daily', // Täglich statt wöchentlich
      },
    },
  },
})
```

### Manuelle Konfiguration

Falls die automatische Konfiguration fehlschlägt (z.B. bei bestimmten Account-Typen), können Sie die Schedule manuell im Stripe Dashboard konfigurieren.

## Support

Bei Fragen zur Auszahlungsgeschwindigkeit:
1. Prüfen Sie Ihr Stripe Dashboard für aktuelle Auszahlungszeiten
2. Aktivieren Sie Instant Payouts für schnellste Auszahlungen
3. Kontaktieren Sie Stripe Support bei technischen Problemen
