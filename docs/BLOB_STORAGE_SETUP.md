# Vercel Blob Storage Setup Guide

## Übersicht

Helvenda verwendet jetzt Vercel Blob Storage für alle Bilder statt Base64-Strings in der Datenbank. Dies ermöglicht:

- ✅ Skalierung auf Millionen von Produkten
- ✅ Schnellere Page-Loads (kleinere Datenbank-Größe)
- ✅ Bessere Performance (CDN-Optimierung)
- ✅ Erfolgreiche Deployments (keine Page-Größen-Limits mehr)

## Setup-Schritte

### 1. Vercel Blob Storage aktivieren

1. Gehe zu [Vercel Dashboard](https://vercel.com/dashboard)
2. Wähle dein Projekt "helvenda"
3. Gehe zu **Storage** → **Create Database**
4. Wähle **Blob** aus
5. Erstelle den Blob Store (z.B. "helvenda-images")

### 2. Environment Variable setzen

Die Blob Storage Token wird automatisch von Vercel gesetzt. Stelle sicher, dass:

- `BLOB_READ_WRITE_TOKEN` ist in Vercel Project Settings gesetzt
- Oder verwende `@vercel/blob` SDK (automatisch konfiguriert)

### 3. Environment Variable für Page-Größe

**WICHTIG:** Setze diese Variable in Vercel Project Settings (nicht nur in vercel.json):

1. Vercel Dashboard → Project Settings → Environment Variables
2. Füge hinzu:
   - **Name:** `VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR`
   - **Value:** `1`
   - **Environment:** Production, Preview, Development
3. Redeploy das Projekt

### 4. Migration bestehender Bilder

Führe das Migration-Script aus:

```bash
npm run migrate:images-to-blob
```

Dieses Script:
- Migriert alle Base64-Bilder zu Blob Storage
- Aktualisiert Datenbank mit Blob URLs
- Behält bestehende URLs bei
- Zeigt Fortschritt und Statistiken

**Hinweis:** Die Migration kann bei vielen Bildern einige Zeit dauern. Das Script verarbeitet Bilder in Batches von 10.

## Code-Änderungen

### Neue Uploads

Alle neuen Uploads gehen automatisch zu Blob Storage:

- **Watch Images:** `/api/watches/create` → Upload zu `watches/{watchId}/`
- **Profile Images:** `/api/profile/upload-image` → Upload zu `profiles/{userId}/`
- **Watch Edit:** `/api/watches/[id]/edit` → Upload neue Bilder zu Blob Storage

### Frontend

Keine Änderungen nötig! Das Frontend funktioniert mit URLs genauso wie mit Base64.

### Image Display

Die `ProductCard` und andere Komponenten unterstützen automatisch:
- Blob Storage URLs (`https://*.vercel-storage.com/...`)
- Externe URLs (`https://...`)
- Base64 (während Migration, wird automatisch migriert)

## Monitoring

### Blob Storage Usage

Überwache die Nutzung in Vercel Dashboard:
- **Storage:** Gespeicherte Datenmenge
- **Bandwidth:** Übertragene Datenmenge
- **Requests:** Anzahl der Requests

### Kosten-Schätzung

**Vercel Blob Storage Pricing:**
- Storage: $0.15/GB pro Monat
- Bandwidth: $0.40/GB

**Beispiel für 1M Produkte mit je 5 Bildern à 500KB:**
- Storage: ~2.5TB = $375/Monat
- Bandwidth: Abhängig von Traffic

## Troubleshooting

### Migration schlägt fehl

1. Prüfe `BLOB_READ_WRITE_TOKEN` ist gesetzt
2. Prüfe Vercel Blob Store ist erstellt
3. Prüfe Netzwerk-Verbindung
4. Führe Migration in kleineren Batches aus

### Bilder werden nicht angezeigt

1. Prüfe Blob URLs sind korrekt gespeichert
2. Prüfe CORS-Einstellungen in Vercel
3. Prüfe `next.config.js` remotePatterns für Blob Storage

### Page-Größe immer noch zu groß

1. Stelle sicher, dass Migration abgeschlossen ist
2. Prüfe dass keine Base64-Bilder mehr in `getFeaturedProducts` enthalten sind
3. Setze `VERCEL_BYPASS_FALLBACK_OVERSIZED_ERROR=1` in Vercel Settings

## Nächste Schritte

Nach erfolgreicher Migration:

1. ✅ Entferne Base64-Parsing-Logik (optional)
2. ✅ Optimiere Bildgrößen-Limits (nicht mehr nötig)
3. ✅ Implementiere Bild-Optimierung (Vercel Image Optimization)
4. ✅ Setup CDN-Caching für bessere Performance

## Support

Bei Problemen:
1. Prüfe Vercel Logs
2. Prüfe Migration-Script Output
3. Kontaktiere Vercel Support falls nötig

