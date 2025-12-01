# Terminologie-Bereinigung: "Uhren" → "Artikel"

## Durchgeführte Änderungen

### 1. Code-Kommentare bereinigt

#### `src/app/api/admin/stats/route.ts`
- **Vorher:** `// Alle Uhren mit Purchases zum Filtern`
- **Nachher:** `// Alle Artikel mit Purchases zum Filtern`

#### `src/app/sell/page.tsx`
- **Vorher:** `// Uhren-spezifische Details`
- **Nachher:** `// Artikel-spezifische Details (für Uhren & Schmuck)`

- **Vorher:** `{/* Lieferumfang - NUR für Uhren */}`
- **Nachher:** `{/* Lieferumfang - NUR für Uhren & Schmuck */}`

- **Vorher:** `{/* Garantie - NUR für Uhren */}`
- **Nachher:** `{/* Garantie - NUR für Uhren & Schmuck */}`

#### `src/app/my-watches/edit/[id]/page.tsx`
- **Vorher:** `{/* Lieferumfang - NUR für Uhren */}`
- **Nachher:** `{/* Lieferumfang - NUR für Uhren & Schmuck */}`

- **Vorher:** `{/* Garantie - NUR für Uhren */}`
- **Nachher:** `{/* Garantie - NUR für Uhren & Schmuck */}`

#### `src/app/api/watches/[id]/edit/route.ts`
- **Vorher:** `// Uhren-spezifisch`
- **Nachher:** `// Uhren & Schmuck-spezifisch`

### 2. Übersetzungen aktualisiert

#### `src/translations/de.ts`
- **Vorher:** `'von Uhren über Elektronik bis hin zu Möbeln und mehr.'`
- **Nachher:** `'von Uhren & Schmuck über Elektronik bis hin zu Möbeln und mehr.'`

## Bereits korrekt (keine Änderung nötig)

### Kategorienamen
- ✅ `"Uhren & Schmuck"` - Korrekt als Kategoriename
- ✅ `"uhren-schmuck"` - Korrekt als Kategorie-Slug

### Unterkategorien
- ✅ `"Armbanduhren Herren"` - Korrekt als Unterkategorie
- ✅ `"Armbanduhren Damen"` - Korrekt als Unterkategorie
- ✅ `"Luxusuhren"` - Korrekt als Unterkategorie
- ✅ `"Taschenuhren"` - Korrekt als Unterkategorie
- ✅ `"Vintage-Uhren"` - Korrekt als Unterkategorie
- ✅ `"Wanduhren"` - Korrekt als Unterkategorie

### Technische Variablen
- ✅ `watch.title`, `watch.brand`, `watch.model` - Korrekt als Code-Variablen
- ✅ `watchId` - Korrekt als API-Parameter
- ✅ `prisma.watch` - Korrekt als Datenbank-Modell

### Spezifische Regelungen
- ✅ `"5.9.2 Angaben bei Schmuck und Uhren"` - Korrekt als Regel-Titel
- ✅ `"Schmuck und Uhren aus unedlem Metall..."` - Korrekt als Regel-Text
- ✅ `"Nachahmungen, Fälschungen (z.B. Uhren, Schmuck, Bekleidung)"` - Korrekt als Beispiel

## Zusammenfassung

**Geändert:** 7 Code-Kommentare + 1 Übersetzung
**Unverändert:** Alle Kategorienamen, Unterkategorien, technische Variablen und spezifische Regelungen bleiben korrekt

Die Terminologie ist jetzt konsistent:
- **"Artikel"** für allgemeine Produkt-Referenzen
- **"Uhren & Schmuck"** für die spezifische Kategorie
- **"Armbanduhren", "Luxusuhren"** etc. für Unterkategorien
- Technische Variablen bleiben unverändert (watch, watchId, etc.)

