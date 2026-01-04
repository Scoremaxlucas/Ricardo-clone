# Purchase vs Order System - Dokumentation

Diese Dokumentation erklärt die beiden Kauf-Systeme auf Helvenda und wann welches verwendet wird.

## Übersicht

Helvenda hat historisch bedingt **zwei Systeme** für Käufe:

| System       | Model      | Zweck                                  | Stripe-Integration      |
| ------------ | ---------- | -------------------------------------- | ----------------------- |
| **Purchase** | `Purchase` | Klassischer Kauf (ohne Zahlungsschutz) | Optional (nachträglich) |
| **Order**    | `Order`    | Kauf mit Zahlungsschutz                | Vollständig integriert  |

---

## Wann wird welches System verwendet?

### 1. Purchase-System (Alt)

**Verwendet bei:**

- Käufe **ohne** Zahlungsschutz
- Direktzahlung zwischen Käufer und Verkäufer
- Banküberweisung, Barzahlung bei Abholung

**Flow:**

```
Käufer klickt "Kaufen" (ohne Zahlungsschutz)
    ↓
Purchase wird erstellt (status: "pending")
    ↓
Käufer kontaktiert Verkäufer
    ↓
Zahlung direkt an Verkäufer
    ↓
Verkäufer bestätigt Zahlungseingang
    ↓
Artikel wird versendet
    ↓
Käufer bestätigt Erhalt
```

**API-Endpoints:**

- `POST /api/purchases/create` - Erstellt Purchase
- `GET /api/purchases/my-purchases` - Meine Käufe
- `POST /api/purchases/[id]/mark-paid` - Zahlung bestätigen
- `POST /api/purchases/[id]/confirm-received` - Erhalt bestätigen

### 2. Order-System (Neu)

**Verwendet bei:**

- Käufe **mit** Zahlungsschutz
- Zahlung über Stripe (Kreditkarte, TWINT)
- Plattform hält Geld bis Käufer bestätigt

**Flow:**

```
Käufer klickt "Mit Zahlungsschutz kaufen"
    ↓
Order wird erstellt (orderStatus: "awaiting_payment")
    ↓
Stripe Checkout Session wird erstellt
    ↓
Käufer zahlt via Stripe
    ↓
Webhook: payment_intent.succeeded
    ↓
Order-Status → "paid"
    ↓
Verkäufer versendet Artikel
    ↓
Käufer bestätigt Erhalt ODER Auto-Release nach 14 Tagen
    ↓
Geld wird an Verkäufer ausgezahlt (Stripe Connect)
```

**API-Endpoints:**

- `POST /api/orders/create` - Erstellt Order
- `POST /api/orders/[id]/checkout` - Startet Stripe Checkout
- `GET /api/orders/my-orders` - Meine Bestellungen
- `POST /api/orders/[id]/confirm-receipt` - Erhalt bestätigen
- `POST /api/stripe/webhook` - Verarbeitet Stripe Events

---

## Datenbank-Modelle

### Purchase Model

```prisma
model Purchase {
  id                String    @id
  price             Float?
  status            String    @default("pending")
  itemReceived      Boolean   @default(false)
  paymentConfirmed  Boolean   @default(false)
  contactDeadline   DateTime

  // Dispute-System (40+ Felder)
  disputeStatus     String?
  disputeReason     String?
  // ...

  // Optionale Stripe-Integration
  stripePaymentIntentId String?

  watchId           String
  buyerId           String
}
```

### Order Model

```prisma
model Order {
  id              String  @id
  orderNumber     String  @unique

  // Preise
  itemPrice       Float
  shippingCost    Float
  platformFee     Float
  protectionFee   Float?
  totalAmount     Float

  // Stripe-IDs
  stripePaymentIntentId   String?
  stripeChargeId          String?
  stripeTransferId        String?

  // Status
  orderStatus     String  @default("awaiting_payment")
  paymentStatus   String  @default("created")

  // Auto-Release
  autoReleaseAt   DateTime?

  watchId         String
  buyerId         String
  sellerId        String
}
```

---

## Verknüpfung Purchase ↔ Order

Ein `Purchase` kann **optional** eine `Order` haben:

```typescript
// In MyPurchasesClient.tsx:
if (purchase.orderId) {
  // Geschützter Kauf → Order-API verwenden
  await fetch(`/api/orders/${purchase.orderId}/confirm-receipt`)
} else {
  // Klassischer Kauf → Purchase-API verwenden
  await fetch(`/api/purchases/${purchase.id}/confirm-received`)
}
```

---

## Empfehlung: Migration zu einem System

### Langfristiges Ziel

Alle Käufe sollten durch das **Order-System** laufen:

1. **Order** als primäres System
2. **Purchase** nur noch für Legacy-Daten

### Migrationsschritte (Zukunft)

1. **Phase 1**: Neue Käufe immer als Order erstellen
2. **Phase 2**: Purchase-Felder in Order integrieren
3. **Phase 3**: Purchase-Model deprecated markieren
4. **Phase 4**: Migration bestehender Purchases zu Orders

### Vorteile eines einheitlichen Systems

- Einfachere Codebase
- Konsistente API
- Bessere Wartbarkeit
- Keine Fallunterscheidungen im Frontend

---

## Aktueller Status

| Feature             | Purchase       | Order     |
| ------------------- | -------------- | --------- |
| Basis-Kauf          | ✅             | ✅        |
| Stripe-Zahlung      | ⚠️ Optional    | ✅ Native |
| Zahlungsschutz      | ❌             | ✅        |
| Dispute-System      | ✅ Vollständig | ✅ Basis  |
| Auto-Release        | ❌             | ✅        |
| Gebühren-Berechnung | ❌             | ✅        |
| Webhook-Integration | ❌             | ✅        |

---

## Code-Beispiele

### Prüfen welches System verwendet wird

```typescript
// API: Prüfen ob Order vorhanden
const hasOrder = !!purchase.orderId

// Frontend: Korrekte API aufrufen
const confirmReceipt = async (purchase: Purchase) => {
  if (purchase.orderId) {
    // Order-System
    return fetch(`/api/orders/${purchase.orderId}/confirm-receipt`, {
      method: 'POST',
    })
  } else {
    // Purchase-System
    return fetch(`/api/purchases/${purchase.id}/confirm-received`, {
      method: 'POST',
    })
  }
}
```

### Neue Käufe erstellen

```typescript
// Mit Zahlungsschutz → Order
const createProtectedPurchase = async (watchId: string) => {
  const res = await fetch('/api/orders/create', {
    method: 'POST',
    body: JSON.stringify({ watchId }),
  })
  const { order } = await res.json()
  // Weiter zu Stripe Checkout
  window.location.href = order.checkoutUrl
}

// Ohne Zahlungsschutz → Purchase
const createDirectPurchase = async (watchId: string) => {
  const res = await fetch('/api/purchases/create', {
    method: 'POST',
    body: JSON.stringify({ watchId }),
  })
  const { purchase } = await res.json()
  // Weiter zu Kontaktseite
}
```

---

## Fazit

- **Purchase**: Legacy-System für direkte Zahlungen
- **Order**: Modernes System mit Zahlungsschutz
- **Langfristig**: Migration zu einheitlichem Order-System empfohlen

Bei Fragen: Dokumentation oder Code-Kommentare prüfen.
