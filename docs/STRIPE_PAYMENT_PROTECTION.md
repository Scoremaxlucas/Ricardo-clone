# Helvenda Stripe Payment Protection - Technical Documentation

## Overview

Helvenda uses Stripe's **Separate Charges and Transfers** pattern to implement buyer protection:

1. **Buyer pays** → Platform receives funds
2. **Platform holds funds** → Escrow-like behavior
3. **Seller ships** → Tracking provided
4. **Buyer confirms** OR **72h timeout** → Platform transfers funds to seller
5. **Dispute** → Admin reviews and decides refund vs release

## Integration Model

### Pattern: Separate Charges and Transfers

```
┌─────────┐     ┌──────────────┐     ┌─────────────┐
│  Buyer  │────▶│   Platform   │────▶│   Seller    │
│ (Card)  │     │   (Stripe)   │     │ (Connect)   │
└─────────┘     └──────────────┘     └─────────────┘
     │                │                     │
     │  1. Checkout   │                     │
     │    Session     │                     │
     │───────────────▶│                     │
     │                │                     │
     │  2. Payment    │                     │
     │    Success     │                     │
     │◀───────────────│                     │
     │                │                     │
     │    (72h hold)  │                     │
     │                │                     │
     │  3. Confirm or │                     │
     │    Timeout     │                     │
     │───────────────▶│                     │
     │                │  4. Transfer        │
     │                │────────────────────▶│
     │                │                     │
```

### Why This Pattern?

- **Full control** over when seller receives funds
- **Escrow-like** behavior without requiring escrow license
- **Dispute handling** - platform can refund before transfer
- **Flexible fees** - platform keeps fee before transfer

## Order State Machine

### Payment Status Flow

```
created → awaiting_payment → paid → release_pending → released
                               │
                               ├──→ disputed → refunded
                               │            └──→ released
                               │
                               └──→ refunded (direct by admin)
```

| Status | Description |
|--------|-------------|
| `created` | Order created, awaiting checkout |
| `awaiting_payment` | Checkout started, waiting for payment |
| `paid` | Payment successful, funds held |
| `release_pending` | Buyer confirmed receipt, transfer in progress |
| `released` | Transfer to seller complete |
| `disputed` | Buyer opened dispute |
| `refunded` | Funds returned to buyer |

### Order Status Flow

```
awaiting_payment → processing → shipped → delivered → completed
                                                   ↓
                                                canceled
```

## Webhook Events Handled

| Event | Handler | Database Changes |
|-------|---------|------------------|
| `checkout.session.completed` | Creates PaymentRecord | Order: paymentStatus=paid, orderStatus=processing |
| `payment_intent.succeeded` | Updates PaymentRecord | PaymentRecord: stripePaymentIntentId |
| `payment_intent.payment_failed` | Notifies seller | Notification created |
| `transfer.created` | Confirms release | Order: paymentStatus=released, orderStatus=completed |
| `charge.refunded` | Confirms refund | Order: paymentStatus=refunded, orderStatus=canceled |
| `account.updated` | Connect onboarding | User: stripeOnboardingComplete |

## Fund Release Triggers

Funds are released to the seller when ANY of these occur:

### 1. Buyer Confirms Receipt
```
POST /api/orders/[orderId]/confirm-receipt
→ Order.buyerConfirmedReceipt = true
→ releaseFunds(orderId) → stripe.transfers.create()
```

### 2. Auto-Release After 72 Hours
```
Cron: POST /api/orders/auto-release
→ Finds paid orders where autoReleaseAt < now
→ releaseFunds(orderId) for each
```

### 3. Admin Resolves Dispute (Release)
```
POST /api/orders/[orderId]/resolve-dispute { resolution: 'release' }
→ releaseFunds(orderId)
→ Order.disputeStatus = 'resolved_release'
```

## Security Measures

### Webhook Signature Verification
```typescript
event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

### Idempotency
```typescript
// Tracked in WebhookEvent table
await isEventProcessed(event.id, event.type)
await markEventProcessed(event.id, event.type, orderId)
```

### Metadata
All PaymentIntents and CheckoutSessions include:
- `orderId` - Links to database Order
- `orderNumber` - Human-readable reference
- `watchId`, `buyerId`, `sellerId` - For auditing

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders/create` | POST | Create new order |
| `/api/orders/[orderId]/checkout` | POST | Create Stripe Checkout Session |
| `/api/orders/[orderId]` | GET | Get order details |
| `/api/orders/[orderId]/confirm-receipt` | POST | Buyer confirms receipt |
| `/api/orders/[orderId]/dispute` | POST | Buyer opens dispute |
| `/api/orders/[orderId]/resolve-dispute` | POST | Admin resolves dispute |
| `/api/orders/[orderId]/refund` | POST | Admin refunds order |
| `/api/orders/auto-release` | POST | Cron job for auto-release |
| `/api/stripe/webhook` | POST | Stripe webhook handler |

## Environment Variables

```env
# Required
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Optional
AUTO_RELEASE_TIMEOUT_HOURS=72
CRON_SECRET=your-cron-secret
```

## Stripe Dashboard Setup

1. **Create Webhook Endpoint**
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events to listen:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `transfer.created`
     - `charge.refunded`
     - `account.updated`

2. **Enable Payment Methods**
   - Cards (default)
   - TWINT (Swiss payments)

3. **Configure Connect**
   - Standard or Express accounts
   - Country: Switzerland

## Testing

Run the webhook simulation test:
```bash
npx ts-node scripts/test-stripe-webhooks.ts
```

Test with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

## Troubleshooting

### Common Issues

1. **"Webhook signature verification failed"**
   - Check `STRIPE_WEBHOOK_SECRET` matches dashboard
   - For local testing, use Stripe CLI's webhook secret

2. **"Transfer failed - seller has no Connected Account"**
   - Seller must complete Stripe Connect onboarding
   - Check `User.stripeConnectedAccountId` and `stripeOnboardingComplete`

3. **"Funds already released"**
   - Check `Order.stripeTransferId` - idempotency prevents double transfers

4. **"Auto-release not working"**
   - Ensure cron job is configured
   - Check `Order.autoReleaseAt` is set on paid orders
