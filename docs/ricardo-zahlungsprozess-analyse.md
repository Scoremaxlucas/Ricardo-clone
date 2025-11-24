# Ricardo Zahlungsprozess - Detaillierte Analyse

## 📋 Übersicht: Wie funktioniert es bei Ricardo?

### 1. Direktzahlung (MoneyGuard-ähnliches System)

**Ricardo-Prozess:**
- Käufer überweist Betrag an Treuhandkonto (MoneyGuard)
- Verkäufer erhält Zahlung erst nach Bestätigung des Warenerhalts durch Käufer
- Erhöht Sicherheit für beide Parteien

**Zahlungsmethoden bei Ricardo:**
- Banküberweisung (mit QR-Code)
- TWINT
- Kreditkarte
- PayPal (in manchen Fällen)

**Zeitplan:**
- Käufer hat 14 Tage Zeit zu zahlen
- Nach 14 Tagen: Verkäufer kann stornieren und Provision zurückfordern

---

### 2. Mahnprozess für Gebühren (Verkäufer-Gebühren)

**Ricardo-Zeitplan:**

| Zeitpunkt | Aktion | Details |
|-----------|--------|---------|
| **Tag 0** | Rechnung erstellt | Automatisch nach erfolgreichem Verkauf |
| **Tag 14** | Erste Zahlungsaufforderung | E-Mail mit offenem Saldo + Zahlungsmethoden |
| **Tag 30** | Erste Zahlungserinnerung | E-Mail-Erinnerung |
| **Tag 44** | Zweite Zahlungserinnerung | E-Mail + **CHF 10.– Mahnspesen** |
| **Tag 58** | Letzte Erinnerung + Konto-Sperre | E-Mail + **Konto wird blockiert** |
| **Tag 72** | Inkasso | Übergabe an Inkassobüro |

**E-Mail-Inhalte:**
- Tag 14: Zahlungsaufforderung mit Betrag, Fälligkeitsdatum, Zahlungsmethoden
- Tag 30: Erste Erinnerung mit Betrag und Fälligkeitsdatum
- Tag 44: Zweite Erinnerung mit Betrag, Fälligkeitsdatum, **Mahnspesen CHF 10.–**
- Tag 58: Letzte Erinnerung mit Betrag, Fälligkeitsdatum, **Hinweis auf Konto-Sperre**

**Mahnspesen:**
- CHF 10.– werden zur Rechnung hinzugefügt
- Werden nur einmal berechnet (bei zweiter Erinnerung)

---

### 3. Konto-Sperre bei Nichtzahlung

**Ricardo-Prozess:**
- **Automatische Sperre nach 58 Tagen** bei nicht bezahlten Gebühren
- Konto wird blockiert, User kann nicht mehr:
  - Artikel verkaufen
  - Artikel kaufen
  - Gebote abgeben
  - Preisvorschläge machen
- User sieht Warnung auf der Plattform
- Nach Zahlung: Konto wird automatisch entsperrt

**Weitere Sperrgründe bei Ricardo:**
- Falsche oder unvollständige Angaben
- Zu viele negative Bewertungen
- Verstöße gegen AGB

---

## 🔍 Technische Analyse: Was braucht Helvenda?

### Schema-Erweiterungen

**Invoice-Model erweitern:**
```prisma
model Invoice {
  // ... bestehende Felder ...
  
  // Mahnprozess-Tracking
  firstReminderSentAt    DateTime? // Tag 30
  secondReminderSentAt    DateTime? // Tag 44
  finalReminderSentAt     DateTime? // Tag 58
  reminderCount           Int       @default(0) // Anzahl gesendeter Erinnerungen
  lateFeeAdded            Boolean   @default(false) // Mahnspesen hinzugefügt?
  lateFeeAmount           Float     @default(0) // Betrag der Mahnspesen
  
  // Zahlungs-Tracking
  paymentRequestSentAt   DateTime? // Tag 14 (erste Zahlungsaufforderung)
  paymentMethod           String? // twint, bank, creditcard, paypal
  paymentReference        String? // Referenznummer / Transaction ID
  paymentConfirmedAt      DateTime? // Wann wurde Zahlung bestätigt?
  
  // Konto-Sperre
  accountBlockedAt        DateTime? // Wann wurde Konto gesperrt?
  accountBlockedReason    String? // Grund für Sperre
}
```

**User-Model erweitern:**
```prisma
model User {
  // ... bestehende Felder ...
  
  // Konto-Sperre (bereits vorhanden, aber erweitern)
  isBlocked               Boolean   @default(false)
  blockedAt               DateTime?
  blockedBy               String?
  blockedReason           String? // "unpaid_invoice", "agb_violation", etc.
  
  // Zahlungs-Tracking
  hasUnpaidInvoices       Boolean   @default(false) // Cache-Flag für Performance
  lastInvoiceReminderAt    DateTime? // Letzte Erinnerung
}
```

---

### API-Endpunkte

**1. Zahlungsintegration:**
- `POST /api/invoices/[id]/pay` - Direktzahlung initiieren
- `POST /api/invoices/[id]/confirm-payment` - Zahlung bestätigen (Webhook)
- `GET /api/invoices/[id]/payment-status` - Zahlungsstatus abfragen

**2. Mahnprozess:**
- `POST /api/invoices/process-reminders` - Mahnungen verarbeiten (Cron)
- `POST /api/invoices/[id]/send-reminder` - Manuelle Erinnerung senden
- `GET /api/invoices/[id]/reminder-history` - Erinnerungs-Historie

**3. Konto-Sperre:**
- `POST /api/invoices/check-account-blocks` - Konten prüfen und sperren (Cron)
- `POST /api/admin/users/[userId]/unblock` - Konto entsperren (bereits vorhanden)
- `GET /api/user/block-status` - Block-Status abfragen

---

### Cron-Jobs

**Tägliche Prüfung (z.B. um 2:00 Uhr):**

1. **Mahnprozess-Prüfung:**
   - Prüfe alle Rechnungen mit Status `pending` oder `overdue`
   - Berechne Tage seit Rechnungserstellung
   - Sende entsprechende Erinnerungen:
     - Tag 14: Erste Zahlungsaufforderung
     - Tag 30: Erste Erinnerung
     - Tag 44: Zweite Erinnerung + CHF 10.– Mahnspesen
     - Tag 58: Letzte Erinnerung + Konto-Sperre

2. **Konto-Sperre-Prüfung:**
   - Prüfe alle User mit `hasUnpaidInvoices = true`
   - Prüfe ob Rechnungen älter als 58 Tage sind
   - Sperre Konten automatisch

3. **Zahlungsstatus-Update:**
   - Prüfe Zahlungsstatus bei Zahlungsanbietern (Webhooks)
   - Aktualisiere Rechnungsstatus
   - Entsperre Konten bei Zahlung

---

### E-Mail-Templates

**1. Erste Zahlungsaufforderung (Tag 14):**
- Betrag
- Fälligkeitsdatum
- Zahlungsmethoden
- QR-Code für Banküberweisung
- Link zur Rechnung

**2. Erste Erinnerung (Tag 30):**
- Betrag
- Fälligkeitsdatum
- Hinweis auf Zahlung
- Link zur Rechnung

**3. Zweite Erinnerung (Tag 44):**
- Betrag + **Mahnspesen CHF 10.–**
- Fälligkeitsdatum
- Warnung vor Konto-Sperre
- Link zur Rechnung

**4. Letzte Erinnerung (Tag 58):**
- Betrag + Mahnspesen
- **Hinweis: Konto wird gesperrt**
- Letzte Möglichkeit zur Zahlung
- Link zur Rechnung

**5. Konto-Sperre-Benachrichtigung:**
- Grund: Nicht bezahlte Gebühren
- Betrag
- Anleitung zur Entsperrung (Zahlung)
- Kontaktinformationen

---

### Zahlungsintegration: Stripe/PayPal

**Stripe Integration:**
- Payment Intents für Kreditkarten
- QR-Code für Banküberweisung (Swiss QR-Bill)
- Webhooks für Zahlungsbestätigung
- Automatische Rechnungsaktualisierung

**PayPal Integration:**
- PayPal Checkout
- Webhooks für Zahlungsbestätigung
- Automatische Rechnungsaktualisierung

**TWINT Integration:**
- QR-Code-Generierung
- Manuelle Bestätigung (kein Webhook verfügbar)

**Banküberweisung:**
- QR-Code-Generierung (Swiss QR-Bill)
- Manuelle Bestätigung
- Referenznummer-Tracking

---

## 🎯 Implementierungsplan

### Phase 1: Schema-Erweiterung
1. Invoice-Model erweitern (Mahnprozess-Tracking)
2. User-Model erweitern (Block-Tracking)
3. Migration erstellen

### Phase 2: Mahnprozess
1. Reminder-Logik implementieren
2. E-Mail-Templates erstellen
3. Cron-Job einrichten

### Phase 3: Konto-Sperre
1. Block-Logik implementieren
2. Frontend-Warnungen
3. Entsperr-Logik

### Phase 4: Zahlungsintegration
1. Stripe/PayPal Integration
2. QR-Code-Generierung
3. Webhook-Handler
4. Zahlungsbestätigung

### Phase 5: Frontend
1. Zahlungsseite
2. Rechnungsübersicht mit Mahnungen
3. Block-Warnung
4. Zahlungsstatus-Anzeige

---

## 📊 Vergleich: Ricardo vs. Helvenda (nach Implementierung)

| Feature | Ricardo | Helvenda (geplant) |
|---------|---------|-------------------|
| **Direktzahlung** | ✅ MoneyGuard | ✅ Stripe/PayPal/TWINT |
| **Zahlungsmethoden** | Bank, TWINT, Kreditkarte | Bank, TWINT, Kreditkarte, PayPal |
| **Mahnprozess** | ✅ Automatisch (4 Stufen) | ✅ Automatisch (4 Stufen) |
| **Mahnspesen** | ✅ CHF 10.– | ✅ CHF 10.– |
| **Konto-Sperre** | ✅ Nach 58 Tagen | ✅ Nach 58 Tagen |
| **Automatische Entsperrung** | ✅ Bei Zahlung | ✅ Bei Zahlung |
| **E-Mail-Benachrichtigungen** | ✅ Ja | ✅ Ja |
| **QR-Code** | ✅ Ja | ✅ Ja |





