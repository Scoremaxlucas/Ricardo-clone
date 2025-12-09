# CDN Migration Plan für Helvenda

## Problem
Aktuell werden Produktbilder als Base64-Strings in der PostgreSQL-Datenbank gespeichert. Dies führt zu:
- Sehr großen Datenbanken (jedes Bild ~500KB-2MB als Base64)
- Langsamen Queries
- Page-Größen >19MB (Vercel Limit)
- Skalierungsprobleme bei Millionen von Produkten

## Ziel
Migration zu einem CDN/Blob Storage System für:
- Skalierbarkeit auf Millionen von Produkten
- Schnellere Page-Loads
- Bessere Performance
- Geringere Datenbank-Größe

## Empfohlene Lösung: Vercel Blob Storage

### Vorteile
- Nahtlose Integration mit Vercel
- Automatisches CDN
- Optimierte Bild-Delivery
- Kosten-effizient für große Volumen

### Migration Plan

#### Phase 1: Setup (1-2 Tage)
1. Installiere `@vercel/blob`
2. Erstelle Blob Store auf Vercel
3. Erstelle Migration-Script für bestehende Bilder

#### Phase 2: Upload-Integration (2-3 Tage)
1. Modifiziere `/api/watches` POST endpoint:
   - Upload Bilder zu Vercel Blob statt Base64
   - Speichere Blob-URLs in Datenbank
2. Modifiziere `/api/profile/upload-image`:
   - Upload Profilbilder zu Blob Storage
3. Update Frontend:
   - Verwende `<Image>` Component mit Blob-URLs

#### Phase 3: Migration bestehender Bilder (1-2 Wochen)
1. Erstelle Batch-Migration-Script:
   ```typescript
   // Script: migrate-images-to-blob.ts
   // - Liest alle Watches aus DB
   // - Konvertiert Base64 zu Blob
   // - Upload zu Vercel Blob
   // - Update DB mit Blob-URLs
   ```
2. Führe Migration in Batches durch (z.B. 1000 pro Batch)
3. Validierung: Prüfe dass alle Bilder migriert wurden

#### Phase 4: Cleanup (1 Tag)
1. Entferne Base64-Bilder aus Datenbank
2. Update Schema: `images` Feld von `String` zu `String[]` (URLs)
3. Entferne alte Base64-Parsing-Logik

### Datenbank Schema Änderung

**Vorher:**
```prisma
model Watch {
  images String // Base64 JSON Array
}
```

**Nachher:**
```prisma
model Watch {
  images String // JSON Array mit Blob-URLs: ["https://xxx.vercel.app/...", ...]
}
```

### Code-Änderungen

#### Upload Endpoint
```typescript
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('image') as File

  // Upload zu Vercel Blob
  const blob = await put(`watches/${watchId}/${Date.now()}.jpg`, file, {
    access: 'public',
  })

  // Speichere URL statt Base64
  await prisma.watch.update({
    where: { id: watchId },
    data: {
      images: JSON.stringify([blob.url, ...existingImages])
    }
  })
}
```

#### Frontend
```typescript
// Keine Änderung nötig - URLs funktionieren genauso wie Base64
<Image src={imageUrl} alt={title} />
```

### Kosten-Schätzung

**Vercel Blob Storage:**
- $0.15/GB Storage
- $0.40/GB Bandwidth
- Für 1M Produkte mit je 5 Bildern à 500KB:
  - Storage: ~2.5TB = $375/Monat
  - Bandwidth: Abhängig von Traffic

**Alternative: Cloudinary**
- Free Tier: 25GB Storage, 25GB Bandwidth
- Pro: $99/Monat für 100GB Storage, 100GB Bandwidth
- Bessere Bild-Optimierung (automatisches Resizing, Format-Konvertierung)

### Empfehlung

**Kurzfristig (sofort):**
- Reduziere Base64-Bilder im initialen Response (<100KB)
- Lade größere Bilder über API nach

**Mittelfristig (1-2 Monate):**
- Implementiere Vercel Blob Storage für neue Uploads
- Migriere bestehende Bilder schrittweise

**Langfristig (3-6 Monate):**
- Vollständige Migration zu Blob Storage
- Optional: Wechsel zu Cloudinary für bessere Bild-Optimierung

## Migration Script Template

```typescript
// scripts/migrate-images-to-blob.ts
import { prisma } from '../src/lib/prisma'
import { put } from '@vercel/blob'

async function migrateImages() {
  const watches = await prisma.watch.findMany({
    where: { images: { not: null } },
    select: { id: true, images: true },
  })

  for (const watch of watches) {
    try {
      const images = JSON.parse(watch.images)
      const blobUrls: string[] = []

      for (const image of images) {
        if (image.startsWith('data:image/')) {
          // Konvertiere Base64 zu Blob
          const base64Data = image.split(',')[1]
          const buffer = Buffer.from(base64Data, 'base64')
          const blob = new Blob([buffer])

          // Upload zu Vercel Blob
          const result = await put(
            `watches/${watch.id}/${Date.now()}.jpg`,
            blob,
            { access: 'public' }
          )

          blobUrls.push(result.url)
        } else {
          // Bereits eine URL
          blobUrls.push(image)
        }
      }

      // Update Datenbank
      await prisma.watch.update({
        where: { id: watch.id },
        data: { images: JSON.stringify(blobUrls) },
      })

      console.log(`Migrated watch ${watch.id}`)
    } catch (error) {
      console.error(`Error migrating watch ${watch.id}:`, error)
    }
  }
}

migrateImages()
```

