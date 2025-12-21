# Gekaufte Artikel UX Improvements

## Summary

Refactored the "Gekaufte Artikel" (Purchased Items) page to be cleaner, more consistent, and state-driven. Removed visual clutter, duplicate actions, and contradictory UI elements.

## Files Modified

1. **`src/lib/order-ui-state.ts`** (NEW)
   - Created `getOrderUIState()` helper function
   - Returns clean UI state: statusLabel, statusTone, primaryAction, secondaryActions, deadlineText
   - Ensures only one primary action per order
   - Prevents contradictory actions (e.g., no "confirm receipt" if not shipped)

2. **`src/app/my-watches/buying/purchased/MyPurchasesClient.tsx`**
   - Removed KPI tiles (duplicated filter tabs)
   - Refactored order card structure:
     - Clean header row: image, title, metadata, price, status badge
     - Single primary CTA button (right side)
     - Metadata row: purchase type, date, seller, shipping method
     - Status badge with tone (neutral/warn/success/danger)
     - Deadline text (fixed copy: "Bitte innerhalb von X Tagen kontaktieren")
   - Refactored expanded details:
     - Cleaner timeline visualization
     - Seller contact card (removed duplicate blue box)
     - Payment info card (only when needed)
     - Shipping tracking card (only when available)
     - Secondary actions as text links (not buttons)
   - Removed duplicate "Verkäufer kontaktieren" buttons
   - Removed contradictory actions (e.g., "Artikel erhalten bestätigen" when contact pending)

3. **`src/app/my-watches/buying/purchased/page.tsx`**
   - Fixed copy: "Zurück zu Mein Kaufen" → "Zurück zu Meinen Käufen"

## Key Improvements

### A) State-Driven UI

- ✅ Each order shows exactly ONE primary CTA
- ✅ No irrelevant actions for given state
- ✅ Primary action never contradicts state (e.g., no "confirm receipt" if not shipped)

### B) Removed Duplication

- ✅ Removed KPI tiles (kept filter tabs)
- ✅ Removed duplicate seller info boxes
- ✅ Removed duplicate "contact seller" buttons
- ✅ Single "Details" expand/collapse button

### C) Copy Fixes

- ✅ Fixed deadline text: "7 Tage bis Kontakt innerhalb 7 Tagen" → "Bitte innerhalb von 7 Tagen kontaktieren"
- ✅ Fixed back link: "Zurück zu Mein Kaufen" → "Zurück zu Meinen Käufen"
- ✅ Consistent button labels

### D) Visual Cleanup

- ✅ Reduced colored backgrounds (only status badge + primary CTA use color)
- ✅ Softer borders (border-gray-200 instead of border-2)
- ✅ Better spacing and alignment
- ✅ Consistent button sizes
- ✅ Removed visual noise (fewer badges, cleaner cards)

### E) Responsive Design

- ✅ Mobile-friendly layout
- ✅ CTA stays accessible
- ✅ No cramped rows

## Before/After UI Decisions

### Before:

- KPI tiles + filter tabs (duplication)
- Multiple primary buttons per card
- Contradictory actions visible
- Heavy borders and colored backgrounds
- Duplicate seller info
- Confusing deadline text

### After:

- Filter tabs only (removed KPI tiles)
- One primary CTA per card
- State-driven actions (no contradictions)
- Clean, minimal design
- Single seller info location
- Clear deadline text

## Acceptance Criteria ✅

- ✅ Each order shows exactly one primary CTA
- ✅ No irrelevant actions appear for a given state
- ✅ No duplicated "contact seller" buttons
- ✅ Copy reads correctly in German
- ✅ Page feels less noisy and more "premium"
