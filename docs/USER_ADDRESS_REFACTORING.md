# User Address Refactoring (Phase 1)

## Übersicht

Diese Dokumentation beschreibt die Extraktion der Adressfelder aus dem User-Model in ein eigenständiges `UserAddress` Model. Dies ist der erste Schritt einer größeren Refaktorierung zur Verbesserung der Datenstruktur.

## Motivation

Das ursprüngliche User-Model hatte **~140 Felder**, was zu folgenden Problemen führte:

- **Unübersichtlichkeit**: Schwer zu verstehen und zu warten
- **Performance**: Alle Felder werden immer geladen, auch wenn nicht benötigt
- **Duplikation**: 3x Adressfelder (Haupt, Lieferung, Rechnung) mit gleicher Struktur
- **Inkonsistenz**: Unterschiedliche Handhabung je nach Kontext

## Neue Struktur

### UserAddress Model

```prisma
model UserAddress {
  id            String   @id @default(cuid())
  userId        String
  type          String   // 'MAIN', 'DELIVERY', 'BILLING'
  
  street        String
  streetNumber  String
  postalCode    String
  city          String
  country       String   @default("Schweiz")
  addresszusatz String?
  kanton        String?
  
  isDefault     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(...)

  @@unique([userId, type])
  @@map("user_addresses")
}
```

### Adresstypen

| Typ | Beschreibung | Verwendung |
|-----|--------------|------------|
| `MAIN` | Wohnadresse | Profil, Stripe Connect, Rechnungen |
| `DELIVERY` | Lieferadresse | Bestellungen mit separater Lieferung |
| `BILLING` | Rechnungsadresse | (Derzeit nicht verwendet) |

## Migration

### SQL Migration

Die Migration (`prisma/migrations/20250704_add_user_address/migration.sql`):

1. Erstellt die neue `user_addresses` Tabelle
2. Migriert bestehende Adressen aus dem `users` Table
3. **Behält** die alten Spalten für Abwärtskompatibilität

### Migrations-Script

```bash
# Statistiken anzeigen
npx tsx scripts/migrate-user-addresses.ts --stats

# Dry-Run (zeigt was migriert würde)
npx tsx scripts/migrate-user-addresses.ts --dry-run

# Migration ausführen
npx tsx scripts/migrate-user-addresses.ts

# Integrität prüfen
npx tsx scripts/migrate-user-addresses.ts --verify
```

## Helper Library

### `src/lib/address.ts`

```typescript
import { 
  getUserAddresses,
  getUserAddress,
  getMainAddress,
  getDeliveryAddress,
  upsertUserAddress,
  deleteUserAddress,
  isAddressComplete,
  validateSwissPostalCode,
  formatAddressLine,
  formatAddressMultiline,
} from '@/lib/address'

// Adresse abrufen
const mainAddress = await getMainAddress(userId)

// Adresse speichern/aktualisieren
await upsertUserAddress(userId, 'MAIN', {
  street: 'Bahnhofstrasse',
  streetNumber: '10',
  postalCode: '8001',
  city: 'Zürich',
})

// Validierung
if (!isAddressComplete(address)) {
  const missing = getMissingAddressFields(address)
  // ['Strasse', 'Hausnummer']
}

// Formatierung
formatAddressLine(address) // "Bahnhofstrasse 10, 8001 Zürich"
formatAddressMultiline(address) // ["Bahnhofstrasse 10", "8001 Zürich"]
```

## Dual-Write Strategie

Während der Übergangsphase werden Adressen an **zwei Stellen** gespeichert:

1. **Legacy**: Direkt auf dem User-Model (Abwärtskompatibilität)
2. **Neu**: In der UserAddress-Tabelle

```typescript
// In API Routes:
// 1. User mit Legacy-Feldern aktualisieren
await prisma.user.update({
  where: { id: userId },
  data: { street, city, ... }
})

// 2. UserAddress aktualisieren (non-blocking)
await upsertUserAddress(userId, 'MAIN', { street, city, ... })
```

## Betroffene API Routes

| Route | Änderung |
|-------|----------|
| `/api/profile/update` | Dual-Write (User + UserAddress) |
| `/api/verification/submit` | Dual-Write für MAIN + DELIVERY |
| `/api/verification/get` | Gibt beide Strukturen zurück |
| `/api/profile/check-complete` | Fallback zu UserAddress wenn leer |

## Tests

```bash
# Alle Tests ausführen
npm test

# Nur Address-Tests
npm test -- src/__tests__/lib/address.test.ts
```

Abgedeckte Testfälle:
- ✅ Validierung (isAddressComplete, validateSwissPostalCode)
- ✅ Fehlende Felder erkennen
- ✅ Legacy-Felder Migration
- ✅ Formatierung (single-line, multi-line)

## Phase 2 (Zukünftig)

Nach vollständiger Migration können die Legacy-Felder entfernt werden:

```sql
-- ERST NACH VOLLSTÄNDIGER MIGRATION!
ALTER TABLE users 
DROP COLUMN street,
DROP COLUMN streetNumber,
DROP COLUMN postalCode,
DROP COLUMN city,
DROP COLUMN country,
DROP COLUMN addresszusatz,
DROP COLUMN kanton,
DROP COLUMN deliveryStreet,
DROP COLUMN deliveryStreetNumber,
DROP COLUMN deliveryPostalCode,
DROP COLUMN deliveryCity,
DROP COLUMN deliveryCountry,
DROP COLUMN billingStreet,
DROP COLUMN billingStreetNumber,
DROP COLUMN billingPostalCode,
DROP COLUMN billingCity,
DROP COLUMN billingCountry;
```

## Checkliste vor Phase 2

- [ ] Alle API Routes nutzen UserAddress
- [ ] Alle Komponenten nutzen UserAddress
- [ ] Migrations-Skript zeigt 0 ausstehende Migrationen
- [ ] Production Daten vollständig migriert
- [ ] Backup vor Spalten-Entfernung erstellt

## Zusammenfassung

| Vorher | Nachher |
|--------|---------|
| 17 Adressfelder auf User | 1 Relation zu UserAddress |
| Keine Typensicherheit | `type: 'MAIN' | 'DELIVERY' | 'BILLING'` |
| Code-Duplikation | Zentralisierte Helper-Library |
| Schwer erweiterbar | Einfach neue Typen hinzufügen |
