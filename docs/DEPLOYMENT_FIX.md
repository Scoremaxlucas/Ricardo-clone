# Deployment Fix - Page Size Reduction

## Problem
Deployments schlagen fehl wegen `FALLBACK_BODY_TOO_LARGE`:
- Page-Größe: 24-27 MB
- Limit: 19.07 MB
- Ursache: Base64-Bilder in Server-Response

## Lösung

### 1. Base64-Bilder aus Server-Response entfernt
- `getFeaturedProducts` enthält jetzt **NUR URLs** (Blob Storage)
- Base64-Bilder werden über Batch-API nachgeladen
- Page-Größe reduziert sich drastisch

### 2. Environment Variable setzen
**WICHTIG:** In Vercel Project Settings (nicht nur vercel.json):

1. Vercel Dashboard → Project Settings → Environment Variables
2. Füge hinzu:
   - **Name:** `VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR`
   - **Value:** `1`
   - **Environment:** Production, Preview, Development
3. Redeploy

### 3. Migration ausführen (optional, aber empfohlen)
```bash
npm run migrate:images-to-blob
```

Dies konvertiert alle Base64-Bilder zu Blob Storage URLs.

## Wie es funktioniert

1. **Server-Side (getFeaturedProducts):**
   - Enthält nur URLs (Blob Storage)
   - Base64-Bilder werden gefiltert
   - Page-Größe bleibt klein

2. **Client-Side (FeaturedProductsServer):**
   - Lädt fehlende Bilder über Batch-API
   - Zeigt Bilder sofort wenn URLs vorhanden
   - Nachladung für Base64-Bilder (während Migration)

3. **Nach Migration:**
   - Alle Bilder sind URLs
   - Keine Base64 mehr
   - Maximale Performance

## Erwartetes Ergebnis

- ✅ Page-Größe < 19 MB
- ✅ Erfolgreiche Deployments
- ✅ Bilder werden über Batch-API nachgeladen
- ✅ Performance wie Ricardo








