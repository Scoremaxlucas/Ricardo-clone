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

## Phase 2 Status

Die Migration zum Entfernen der Legacy-Felder ist vorbereitet:

**Erstellt:**
- ✅ `prisma/migrations/20250704_remove_legacy_address_fields/migration.sql`
- ✅ Helper-Funktionen mit Fallback (`getUserMainAddressData`, `getUserDeliveryAddressData`)
- ✅ Legacy-Felder im Schema als `@deprecated` markiert

**Bereits aktualisiert (Phase 2 - 25+ Dateien):**
```
✅ src/app/api/stripe/connect/account-session/route.ts
✅ src/app/api/stripe/connect/prefill-data/route.ts
✅ src/app/api/profile/check-complete/route.ts
✅ src/app/api/profile/update/route.ts
✅ src/app/api/verification/get/route.ts
✅ src/app/api/verification/submit/route.ts
✅ src/app/api/user/[id]/route.ts
✅ src/app/api/user/seller-info/route.ts
✅ src/app/api/users/[id]/stats/route.ts
✅ src/app/api/invoices/[id]/pdf/route.ts
✅ src/app/api/purchases/create/route.ts
✅ src/app/api/sales/my-sales/route.ts
✅ src/app/api/sales/[id]/route.ts
✅ src/app/api/watches/boosted/route.ts
✅ src/app/api/watches/mine/route.ts
✅ src/app/api/watches/route.ts
✅ src/app/api/watches/recommended/route.ts
✅ src/app/api/watches/nearby/route.ts
✅ src/app/api/watches/[id]/similar/route.ts
✅ src/app/api/articles/fast/route.ts
✅ src/app/api/articles/auctions-fast/route.ts
✅ src/app/api/articles/search-fast/route.ts
✅ src/app/api/articles/favorites-fast/route.ts
✅ src/app/api/products/[id]/route.ts
```

**Verbleibende Dateien (8 - meist Admin/Legacy):**
```
⏳ src/app/api/stripe/connect/account-link/route.ts (Backwards-compat)
⏳ src/app/api/stripe/connect/ensure-account/route.ts (Backwards-compat)
⏳ src/app/api/watches/brand-counts/route.ts (postalCode filter - special case)
⏳ src/app/api/admin/disputes/[id]/route.ts (Admin only)
⏳ src/app/api/admin/invoices/[invoiceId]/route.ts (Admin only)
⏳ src/app/api/admin/verifications/pending/route.ts (Admin only)
⏳ src/app/api/admin/verifications/user/[userId]/route.ts (Admin only)
⏳ src/app/api/admin/test-lacoste/route.ts (Test route)
```

**Hinweis:** Die verbleibenden Admin-Routes und Stripe-Routes können nach der finalen Migration aktualisiert werden. Sie verwenden derzeit noch die Legacy-Felder für Abwärtskompatibilität.

**Migration ausführen (wenn alle Dateien aktualisiert sind):**

```bash
# 1. Prüfe dass alle Adressen migriert sind
npx tsx scripts/migrate-user-addresses.ts --verify

# 2. Entferne Legacy-Felder aus Schema (manuell)

# 3. Führe Migration aus
npx prisma migrate deploy
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
