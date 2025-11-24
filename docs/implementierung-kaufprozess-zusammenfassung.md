# Implementierung: Verbesserter Kaufprozess nach Ricardo-Vorbild

## ✅ Implementierte Features

### Phase 1: Zahlungsinformationen & Fristen ✅

1. **Automatische Zahlungsinformationen**
   - IBAN/BIC automatisch aus Verkäufer-Profil extrahiert
   - QR-Rechnung für Schweizer Banken generiert
   - Zahlungsinformationen automatisch nach Kontaktaufnahme angezeigt
   - Zahlungsanweisung mit Referenz generiert

2. **14-Tage-Zahlungsfrist**
   - Startet automatisch nach Kontaktaufnahme (Verkäufer oder Käufer)
   - Wird im Purchase-Model gespeichert (`paymentDeadline`)
   - UI zeigt verbleibende Tage mit Farbcodierung

3. **Automatische Zahlungserinnerungen**
   - Erinnerungen nach 7, 10 und 13 Tagen
   - E-Mail-Benachrichtigungen
   - Plattform-Benachrichtigungen
   - Cron-Job: `/api/purchases/check-payment-deadline`

### Phase 2: Dispute-System ✅

1. **Dispute-Eröffnung**
   - Käufer und Verkäufer können Disputes eröffnen
   - Verschiedene Dispute-Gründe (Artikel nicht erhalten, beschädigt, etc.)
   - Beschreibung erforderlich
   - Automatische Benachrichtigungen an beide Parteien und Admins

2. **Dispute-Management**
   - Admin kann Disputes lösen
   - Lösung wird dokumentiert
   - Automatische Benachrichtigungen bei Lösung
   - Optionale Stornierung des Kaufs

3. **UI-Komponenten**
   - `DisputeModal` für Dispute-Eröffnung
   - Dispute-Status-Anzeige in Purchase/Sale-Listen
   - Farbcodierte Warnungen (rot = pending, grün = resolved)

### Phase 3: Versand-Tracking ✅

1. **Versand-Informationen**
   - Tracking-Nummer hinzufügen
   - Versanddienstleister auswählen (Post, DHL, UPS, FedEx)
   - Geschätztes Lieferdatum (optional)
   - Automatische Benachrichtigung an Käufer

2. **Tracking-Integration**
   - Direkte Links zu Versanddienstleister-Tracking-Seiten
   - Versand-Status-Anzeige
   - Versanddatum wird automatisch gespeichert

3. **UI-Komponenten**
   - `ShippingInfoCard` für Versand-Informationen
   - Verkäufer kann Versand-Informationen hinzufügen
   - Käufer kann Tracking-Status verfolgen

### Phase 4: Status-Automatisierung ✅

1. **Status-Historie**
   - Alle Status-Änderungen werden dokumentiert
   - Timestamp, geändert von, Grund
   - JSON-Format im Purchase-Model (`statusHistory`)

2. **Automatische Status-Updates**
   - Bei Zahlungsbestätigung → `payment_confirmed`
   - Bei Erhalt-Bestätigung → `item_received`
   - Wenn beide bestätigt → `completed`
   - Bei Versand → Status-Historie aktualisiert
   - Bei Dispute → Status-Historie aktualisiert

## 📋 Neue API-Routen

### Zahlungsinformationen
- `GET /api/purchases/[id]/payment-info` - Zahlungsinformationen abrufen

### Zahlungsfrist
- `POST /api/purchases/check-payment-deadline` - Cron-Job für Zahlungsfrist-Überwachung

### Dispute
- `POST /api/purchases/[id]/dispute` - Dispute eröffnen
- `GET /api/purchases/[id]/dispute` - Dispute-Informationen abrufen
- `POST /api/admin/disputes/[id]/resolve` - Dispute lösen (Admin)

### Versand
- `POST /api/purchases/[id]/shipping` - Versand-Informationen hinzufügen
- `GET /api/purchases/[id]/shipping` - Versand-Informationen abrufen

## 🗄️ Datenbank-Änderungen

### Purchase-Model (neue Felder)
```prisma
// Zahlungsfrist
paymentDeadline       DateTime?
paymentReminderSentAt DateTime?
paymentDeadlineMissed Boolean   @default(false)

// Versand
trackingNumber       String?
trackingProvider     String?
shippedAt            DateTime?
estimatedDeliveryDate DateTime?

// Dispute
disputeOpenedAt      DateTime?
disputeReason        String?
disputeStatus        String?
disputeResolvedAt    DateTime?
disputeResolvedBy    String?

// Status-Historie
statusHistory        String? // JSON Array
```

## 📧 Neue E-Mail-Templates

1. **Zahlungserinnerung** (`getPaymentReminderEmail`)
   - Erinnerung an Zahlungsfrist
   - Tage bis Fristablauf
   - Link zu Zahlungsinformationen

2. **Dispute eröffnet** (`getDisputeOpenedEmail`)
   - Benachrichtigung an andere Partei
   - Dispute-Grund und Beschreibung
   - Link zu Details

3. **Dispute gelöst** (`getDisputeResolvedEmail`)
   - Benachrichtigung an beide Parteien
   - Lösung des Disputes
   - Link zu Details

## 🎨 Neue UI-Komponenten

1. **PaymentInfoCard** (`src/components/payment/PaymentInfoCard.tsx`)
   - Zeigt IBAN, BIC, Referenz
   - QR-Code für Zahlung
   - Zahlungsanweisung
   - Copy-to-Clipboard-Funktionalität

2. **DisputeModal** (`src/components/dispute/DisputeModal.tsx`)
   - Formular für Dispute-Eröffnung
   - Dispute-Grund auswählen
   - Beschreibung eingeben

3. **ShippingInfoCard** (`src/components/shipping/ShippingInfoCard.tsx`)
   - Versand-Informationen anzeigen/hinzufügen
   - Tracking-Nummer eingeben
   - Versanddienstleister auswählen
   - Direkte Links zu Tracking-Seiten

## 🔧 Neue Utility-Funktionen

1. **payment-info.ts** (`src/lib/payment-info.ts`)
   - `generatePaymentInfo()` - Generiert Zahlungsinformationen
   - `generateQRCodeString()` - Generiert QR-Code String (Swiss QR-Bill)
   - `setPaymentDeadline()` - Setzt Zahlungsfrist

2. **status-history.ts** (`src/lib/status-history.ts`)
   - `addStatusHistory()` - Fügt Status-Eintrag hinzu
   - `getStatusHistory()` - Ruft Status-Historie ab

## ⚙️ Cron-Jobs (zu konfigurieren)

1. **Zahlungsfrist-Überwachung**
   - Route: `/api/purchases/check-payment-deadline`
   - Frequenz: Täglich
   - Authorization: Bearer Token (`CRON_SECRET`)

2. **Kontaktfrist-Überwachung** (bereits vorhanden)
   - Route: `/api/purchases/check-contact-deadline`
   - Frequenz: Täglich

## 🚀 Nächste Schritte

1. **Migration ausführen**
   ```bash
   npx prisma migrate deploy
   ```

2. **Cron-Jobs einrichten**
   - Zahlungsfrist-Cron-Job konfigurieren
   - `CRON_SECRET` in `.env` setzen

3. **Tests durchführen**
   - Zahlungsinformationen testen
   - Dispute-System testen
   - Versand-Tracking testen
   - Status-Historie prüfen

## 📝 Hinweise

- **Stripe Escrow-System** wurde nicht implementiert (optional, niedrige Priorität)
- Alle Features sind Ricardo-ähnlich implementiert
- Rückwärtskompatibilität mit bestehenden Purchases gewährleistet
- Legacy-Felder (`paid`, `paidAt`) bleiben für Kompatibilität erhalten







