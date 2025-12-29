# Listing Visibility Troubleshooting Guide

This document explains why a listing might not appear in public search and how to debug visibility issues.

## Quick Diagnosis

Use the visibility check endpoint:

```bash
GET /api/watches/{watchId}/visibility-check
```

This returns detailed information about why a listing is or isn't visible.

## Visibility Requirements

A listing is visible in public search if **ALL** of these conditions are met:

### 1. Moderation Status ✓

- `moderationStatus` must be `null`, `'pending'`, `'approved'`, or `'reviewing'`
- Only `'rejected'` hides the listing
- **Note:** New listings start as `'pending'` and are immediately visible

### 2. Not Sold ✓

- The listing must NOT have any active (non-cancelled) purchases
- Once a purchase is completed, the listing is hidden from search
- Cancelled purchases don't count as sold

### 3. Auction Not Expired ✓

- For non-auction listings: Always passes
- For auctions: `auctionEnd` must be in the future, OR the auction has a purchase

## Common Issues & Solutions

### Issue: "I just published but it doesn't appear in search"

**Possible Causes:**

1. **Browser Cache**
   - Solution: Hard refresh with `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

2. **API Route Caching** (developer issue)
   - Check that `/api/watches/search/route.ts` has:
     ```typescript
     export const dynamic = 'force-dynamic'
     export const revalidate = 0
     ```

3. **Client Fetch Caching**
   - Check that fetch calls include `cache: 'no-store'`:
     ```typescript
     fetch(url, { cache: 'no-store' })
     ```

### Issue: "Listing shows in 'Mein Verkaufen' but not in search"

**Explanation:**
The seller dashboard (`/api/seller/listings`) shows ALL listings for the seller, while public search applies additional filters.

**Check the visibility endpoint:**

```bash
curl http://localhost:3002/api/watches/{watchId}/visibility-check
```

**Common reasons:**

- Item was sold (check `notSold` in response)
- Auction expired (check `auctionNotExpired` in response)
- Listing was rejected by admin (check `moderationPassed` in response)

### Issue: "Listing was rejected"

**Solution:**

- Contact admin to review the decision
- Create a new listing with modified content
- Check for prohibited keywords/content

## Data Flow Comparison

| Condition     | Seller Dashboard     | Public Search    |
| ------------- | -------------------- | ---------------- |
| Owner check   | ✅ `sellerId = user` | ❌ No filter     |
| Not rejected  | ✅ Yes               | ✅ Yes           |
| Not sold      | ❌ Shows sold items  | ✅ Hides sold    |
| Auction valid | ❌ Shows expired     | ✅ Hides expired |

## Testing the Visibility Pipeline

Run the automated test:

```bash
npx tsx scripts/test-visibility-pipeline.ts
```

This test:

1. Creates a test listing
2. Polls search until it appears (or 5s timeout)
3. Reports success/failure with timing
4. Cleans up the test listing

Expected result: Listing should appear within 5 seconds.

## Visibility Check Response Format

```json
{
  "watchId": "clxxx...",
  "isVisible": true,
  "reasons": ["All visibility checks passed"],
  "checks": {
    "exists": true,
    "moderationStatus": "pending",
    "moderationPassed": true,
    "purchaseCount": 0,
    "activePurchaseCount": 0,
    "notSold": true,
    "isAuction": false,
    "auctionEnd": null,
    "auctionNotExpired": true,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "ageSeconds": 120
  },
  "recommendation": null
}
```

## Server Logs

When a listing is created, look for this log entry:

```
[Watch Create] 🚀 VISIBILITY PIPELINE: {
  watchId: "...",
  timestamp: "...",
  visibility: {
    moderationPassed: true,
    notSold: true,
    auctionNotExpired: true
  },
  expectedSearchVisibility: true
}
```

## Architecture Notes

### Search API Route

- File: `src/app/api/watches/search/route.ts`
- Uses: `listings-search.ts` for query logic
- Caching: `dynamic = 'force-dynamic'`, `Cache-Control: no-store`

### Seller Dashboard Route

- File: `src/app/api/seller/listings/route.ts`
- Shows: All listings for the seller
- Filters: Only excludes rejected listings

### Client Pages

- Search: `src/app/search/page.tsx`
- Categories: `src/app/categories/page.tsx`
- Both use: `cache: 'no-store'` on fetch calls

## Environment Variables

Enable visibility debugging in production:

```env
ENABLE_VISIBILITY_DEBUG=true
```

By default, the visibility check endpoint is enabled in development mode.
