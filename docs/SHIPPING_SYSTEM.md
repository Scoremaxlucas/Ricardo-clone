# Versand-System (Ricardo-Style)

## Übersicht

Das Versand-System implementiert ein zentrales Rate-Catalog-System ähnlich wie Ricardo, mit fixen CH-Preisen für Post-Pakete und Add-ons.

## Datenmodell

### Watch (Listing)

- `deliveryMode`: `'shipping_only' | 'pickup_only' | 'shipping_and_pickup'`
- `freeShippingThresholdChf`: Optionaler Schwellenwert für kostenlosen Versand
- `pickupLocationZip`, `pickupLocationCity`: Öffentliche Abholort-Informationen
- `pickupLocationAddress`: Private Adresse (erst nach Kauf sichtbar)
- `shippingProfile`: JSON mit `{base_service, weight_tier, addons_allowed}`

### Order

- `selectedDeliveryMode`: `'shipping' | 'pickup'`
- `selectedShippingCode`: z.B. `'post_economy_2kg'`
- `selectedAddons`: JSON Array mit `['sperrgut', 'pickhome']`
- `shippingCostChfFinal`: Finaler Versandpreis (inkl. Add-ons, free shipping)
- `shippingCostBreakdown`: JSON mit Preisaufschlüsselung
- `shippingRateSetId`: `'default_ch_post'`

### ShippingRateCatalog

Zentrale Preisliste mit folgenden Einträgen:

**Base Rates:**

- `post_economy_2kg`: CHF 9.00
- `post_economy_10kg`: CHF 12.00
- `post_economy_30kg`: CHF 21.00
- `post_priority_2kg`: CHF 13.50
- `post_priority_10kg`: CHF 15.00
- `post_priority_30kg`: CHF 24.00

**Add-ons:**

- `addon_sperrgut`: CHF 13.00
- `addon_pickhome`: CHF 3.40

## Preisberechnung

Die Funktion `calculateShippingCost()` in `src/lib/shipping-calculator.ts` ist die Single Source of Truth:

1. Lädt Catalog-Einträge für `rateSetId='default_ch_post'`
2. Findet Base Rate basierend auf `service` + `weightTier`
3. Addiert Add-ons (nur wenn erlaubt)
4. Prüft `freeShippingThresholdChf` (wenn `itemPrice >= threshold` → `total = 0`)
5. Rundet auf 0.05 CHF (Schweizer Standard)

## UI-Komponenten

### DeliveryStep (Seller Wizard)

- Lieferart-Auswahl (Cards)
- Versandkonfiguration (Service, Gewichtsklasse)
- Live-Preisberechnung
- Add-on Toggles
- Kostenloser Versand Threshold
- Abholort-Eingabe

### ShippingSelector (Buyer UI)

- Versandoptionen als Radio-Buttons
- Add-on Checkboxes (nur wenn erlaubt)
- Preis-Summary mit Gesamtbetrag
- Abholung-Option mit PLZ/Ort

## API-Endpunkte

### POST /api/orders/create

Akzeptiert:

- `selectedDeliveryMode`: `'shipping' | 'pickup'`
- `selectedShippingCode`: z.B. `'post_economy_2kg'`
- `selectedAddons`: `['sperrgut', 'pickhome']`

Berechnet automatisch:

- `shippingCostChfFinal`
- `shippingCostBreakdown`
- Speichert alle Felder in Order

### POST /api/watches

Akzeptiert neue Shipping-Felder:

- `deliveryMode`
- `freeShippingThresholdChf`
- `pickupLocationZip`, `pickupLocationCity`, `pickupLocationAddress`
- `shippingService`, `shippingWeightTier`, `addonsAllowed`

Speichert als `shippingProfile` JSON.

## Migration & Seed

1. Migration: `prisma/migrations/20250125_add_shipping_rate_catalog/migration.sql`
2. Seed: `prisma/seeds/shipping-rate-catalog.ts`
3. Ausführen: `npm run db:seed`

## Business Rules

1. **delivery_mode**: Bestimmt verfügbare Optionen
   - `pickup_only`: Kein Versand, `shippingCost = 0`
   - `shipping_only`: Nur Versand
   - `shipping_and_pickup`: Beide Optionen

2. **Mindestens 1 Versandoption**: Wenn Versand aktiv, muss mindestens eine Option enabled sein

3. **Add-ons**: Nur wenn Seller erlaubt (`addons_allowed`)

4. **Free Shipping**: Wenn `itemPrice >= freeShippingThresholdChf` → `shippingCost = 0`, aber Option bleibt sichtbar als "Kostenlos"

5. **Preis-Persistenz**: Finale Preise werden in Order gespeichert (keine rückwirkenden Änderungen)

## Nächste Schritte

- [ ] Integration in Seller Wizard (`StepShippingPayment` ersetzen)
- [ ] Integration in Produktdetail-Seite
- [ ] Checkout-Flow aktualisieren
- [ ] Order-Detail-Seite zeigt Shipping-Breakdown
- [ ] Admin-Tool für Rate-Management (optional)
