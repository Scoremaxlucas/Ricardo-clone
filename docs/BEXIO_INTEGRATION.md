# Bexio Integration - Vollständige Dokumentation

## Übersicht

Diese Integration verbindet Helvenda mit Bexio.ch für automatisches Rechnungswesen und Payment Matching via QR-Bill Referenzen.

## Features

### 1. Automatische QR-Referenz Generierung
- **Format**: SCOR (Structured Creditor Reference) gemäss ISO 11649
- **Länge**: 25 Zeichen (RF + 2 Prüfziffern + 21 Nutzzeichen)
- **Inhalt**: Kodiert User ID + Invoice ID + Timestamp + Random

### 2. User → Bexio Kontakt Sync
- Erstellt automatisch Kontakte in Bexio für Verkäufer
- Speichert Bexio Contact ID in der User-Tabelle
- Aktualisiert bestehende Kontakte bei Änderungen

### 3. Invoice → Bexio Rechnung Sync
- Erstellt Rechnungen in Bexio mit eindeutiger QR-Referenz
- Speichert Bexio Invoice ID für Rückverfolgung
- Generiert automatisch QR-Code für Swiss QR-Bill

### 4. Automatisches Payment Matching
- Cron-Job alle 15 Minuten
- Liest eingehende Zahlungen aus Bexio
- Matched via QR-Referenz zu unseren Rechnungen
- Markiert Rechnungen automatisch als bezahlt

---

## Setup

### 1. Bexio API Token

1. Logge dich in Bexio ein
2. Gehe zu **Einstellungen → API → Tokens**
3. Erstelle einen neuen Token mit Berechtigungen:
   - Kontakte: Lesen/Schreiben
   - Rechnungen: Lesen/Schreiben
   - Banking: Lesen

4. Füge den Token als Environment Variable hinzu:

```bash
# .env / Vercel
BEXIO_API_TOKEN=your_api_token_here
```

### 2. Bexio Konfiguration

Passe die Konstanten in `src/lib/bexio-sync.ts` an:

```typescript
const BEXIO_CONFIG = {
  DEFAULT_USER_ID: 1,        // Dein Bexio User ID
  BANK_ACCOUNT_ID: 1,        // Dein QR-Bankkonto ID
  LANGUAGE_ID: 1,            // 1 = Deutsch
  CURRENCY_ID: 1,            // 1 = CHF
  PAYMENT_TYPE_ID: 4,        // QR-Rechnung
  TAX_RATE_ID: 25,           // 8.1% MWST ID (prüfen!)
  PAYMENT_TERMS_DAYS: 30,    // Zahlungsfrist
}
```

### 3. Datenbank Migration

```bash
npx prisma migrate deploy
```

Oder manuell:

```sql
ALTER TABLE "User" ADD COLUMN "bexioContactId" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN "qrReference" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "bexioInvoiceId" INTEGER;
ALTER TABLE "Invoice" ADD COLUMN "paymentMatchedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "paymentMatchedAmount" DECIMAL(10,2);

CREATE UNIQUE INDEX "Invoice_qrReference_key" ON "Invoice"("qrReference");
CREATE INDEX "Invoice_bexioInvoiceId_idx" ON "Invoice"("bexioInvoiceId");
CREATE INDEX "User_bexioContactId_idx" ON "User"("bexioContactId");
```

### 4. Cron Secret (Optional, empfohlen)

```bash
# .env / Vercel
CRON_SECRET=your_secure_random_string
```

---

## API Endpoints

### POST /api/bexio/sync

Synchronisiert User oder Invoice zu Bexio.

**Request:**
```json
// User sync
{ "type": "user", "userId": 123 }

// Invoice sync
{ "type": "invoice", "invoiceId": 456 }
```

**Response:**
```json
{
  "success": true,
  "bexioContactId": 789,     // Bei User sync
  "bexioInvoiceId": 1234,    // Bei Invoice sync
  "qrReference": "RF18A1B2C3D4E5F6G7H8I9J0"
}
```

### GET /api/bexio/sync?invoiceId=456

Prüft Zahlungsstatus einer Rechnung.

**Response:**
```json
{
  "isPaid": true,
  "paidAmount": 150.00,
  "paidAt": "2025-01-18T10:30:00Z"
}
```

### POST /api/bexio/payments

Führt Payment Matching manuell aus.

**Response:**
```json
{
  "success": true,
  "matched": 3,
  "unmatched": 1,
  "errors": []
}
```

### GET /api/cron/bexio-sync

Vercel Cron Job Endpoint (alle 15 Minuten).

---

## QR-Referenz Format

### Struktur (25 Zeichen)

```
RF + CC + UUUUUU + IIIIII + TTTTT + RRRR
│    │    │        │        │       │
│    │    │        │        │       └─ Random (4 chars)
│    │    │        │        └───────── Timestamp (5 chars, base36)
│    │    │        └────────────────── Invoice ID (6 chars, base36)
│    │    └─────────────────────────── User ID (6 chars, base36)
│    └──────────────────────────────── MOD-97 Prüfziffern
└───────────────────────────────────── SCOR Prefix
```

### Beispiel

```
RF185N82A20B1YKQ3ZP4AB
│  │ │    │    │    │
│  │ │    │    │    └─ Random: AB
│  │ │    │    └────── Timestamp
│  │ │    └─────────── Invoice ID: 123456
│  │ └──────────────── User ID: 789
│  └────────────────── Check: 18
└───────────────────── Prefix: RF
```

### Funktionen

```typescript
import { 
  generateUniqueQRReference, 
  parseQRReference,
  validateQRReference,
  formatQRReferenceForDisplay 
} from '@/lib/unique-qr-reference'

// Generieren
const ref = generateUniqueQRReference(userId, invoiceId)
// → "RF185N82A20B1YKQ3ZP4AB"

// Parsen
const { userId, invoiceId, isValid } = parseQRReference(ref)
// → { userId: 789, invoiceId: 123456, isValid: true }

// Validieren
const valid = validateQRReference(ref)
// → true

// Formatieren für Anzeige
const display = formatQRReferenceForDisplay(ref)
// → "RF18 5N82 A20B 1YKQ 3ZP4 AB"
```

---

## Admin Interface

Zugriff: `/admin/bexio`

Features:
- API Status Übersicht
- Manueller User Sync
- Manueller Invoice Sync
- Payment Matching manuell auslösen
- Letzte synchronisierte Rechnungen

---

## Workflow

### 1. Verkauf abgeschlossen (ohne Stripe)

```
1. Sale wird erstellt
2. Invoice wird generiert
3. createBexioInvoice() wird aufgerufen:
   a. User → Bexio Kontakt sync (falls noch nicht)
   b. QR-Referenz wird generiert
   c. Rechnung wird in Bexio erstellt
   d. qrReference + bexioInvoiceId werden gespeichert
4. E-Mail mit QR-Rechnung wird an Verkäufer gesendet
```

### 2. Zahlung eingeht

```
1. Käufer/Verkäufer zahlt via Bank (QR-Bill)
2. Zahlung erscheint in Bexio Banking
3. Cron Job läuft (alle 15 Min):
   a. Holt neue Zahlungen aus Bexio
   b. Extrahiert QR-Referenz
   c. Parsed User ID + Invoice ID
   d. Findet Rechnung in DB
   e. Ordnet Zahlung zu in Bexio
   f. Markiert Rechnung als bezahlt
```

---

## Fehlerbehandlung

### API Fehler
- Werden geloggt in Console
- Retry bei temporären Fehlern
- Admin wird bei kritischen Fehlern benachrichtigt

### Payment Matching Fehler
- Unmatched Zahlungen werden im Result aufgelistet
- Manuelle Zuordnung via Bexio möglich
- Errors Array enthält Details

---

## Sicherheit

1. **API Token**: Nur server-seitig, nie im Client
2. **CRON_SECRET**: Schützt Cron Endpoints
3. **Admin Only**: Sync API nur für Admins
4. **Verschlüsselung**: Alle API Calls über HTTPS

---

## Alternativen zu Bexio

Falls du eine Alternative zu Bexio evaluierst:

| Service | Pro | Contra |
|---------|-----|--------|
| **Bexio** | Schweizer Standard, gute API, QR-Bill native | CHF 39+/Monat |
| **Abacus** | Enterprise-grade, sehr mächtig | Teuer, komplex |
| **Klara** | Gratis Basisversion, einfach | Limitierte API |
| **Run My Accounts** | Vollautomatisch, gut für kleine | Weniger flexibel |
| **Zoho Books** | Günstig, gute API | Nicht CH-optimiert |

Empfehlung: **Bexio** für Schweizer KMU mit QR-Rechnungen.

---

## Support

Bei Problemen:
1. Prüfe Bexio API Status
2. Checke Logs in Vercel
3. Teste mit `/admin/bexio`
4. Kontaktiere support@helvenda.ch
