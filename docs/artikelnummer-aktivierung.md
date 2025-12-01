# Artikelnummer-Aktivierung (RICARDO-STYLE)

## ✅ Was wurde implementiert

Die Artikelnummer-Funktionalität wurde aktiviert und funktioniert jetzt wie bei Ricardo:

1. ✅ **Automatische Generierung**: Neue Artikel erhalten automatisch eine 8-stellige Artikelnummer (10000000-99999999)
2. ✅ **URL-Redirect**: URLs mit CUID werden automatisch zu Artikelnummer-URLs umgeleitet
3. ✅ **Suche**: Artikel können sowohl über Artikelnummer als auch über CUID gefunden werden
4. ✅ **Migration-Script**: Bestehende Artikel können nachträglich nummeriert werden

---

## 🚀 Migration für bestehende Artikel

### Schritt 1: Migration ausführen

```bash
npm run migrate:article-numbers
```

Oder direkt:

```bash
npx tsx scripts/migrate-article-numbers.ts
```

### Schritt 2: Prüfen

Das Script zeigt:
- Anzahl der Artikel ohne Artikelnummer
- Startnummer
- Erfolgreiche/fehlgeschlagene Zuweisungen
- Nächste verfügbare Nummer

---

## 📋 Wie es funktioniert

### Neue Artikel

Beim Erstellen eines neuen Artikels wird automatisch eine Artikelnummer generiert:

```typescript
// In src/app/api/watches/create/route.ts
watchData.articleNumber = await generateArticleNumber()
```

### URL-Zugriff

Artikel können über beide URLs erreicht werden:

- **Artikelnummer**: `/products/12345678` ✅ (bevorzugt, wie Ricardo)
- **CUID**: `/products/clx1234567890abcdef` → wird zu Artikelnummer umgeleitet

### Suche

Die Suche unterstützt beide Formate:

- Artikelnummer: `12345678`
- CUID: `clx1234567890abcdef`

---

## 🔧 Technische Details

### Artikelnummer-Format

- **Typ**: Integer
- **Länge**: 8-stellig
- **Bereich**: 10000000 - 99999999
- **Eindeutigkeit**: Unique Constraint in Datenbank
- **Sequenziell**: Automatisch aufsteigend

### Generierung

```typescript
// Finde höchste vorhandene Nummer
const highest = await prisma.watch.findFirst({
  orderBy: { articleNumber: 'desc' }
})

// Nächste Nummer = höchste + 1
const nextNumber = (highest?.articleNumber || 9999999) + 1
```

### URL-Redirect-Logik

```typescript
// Wenn CUID verwendet wurde, aber Artikelnummer vorhanden ist
if (watch && !isArticleNumber && watch.articleNumber) {
  redirect(`/products/${watch.articleNumber}`)
}
```

---

## 📊 Vergleich mit Ricardo

| Eigenschaft | Ricardo | Helvenda |
|------------|---------|----------|
| Artikelnummer | ✅ Ja | ✅ Ja |
| Format | 6-8 stellig | 8 stellig |
| URL | Artikelnummer | Artikelnummer (bevorzugt) |
| Suche | Artikelnummer | Artikelnummer + CUID |
| Automatisch | ✅ Ja | ✅ Ja |

---

## ✅ Nächste Schritte

1. ✅ Migration ausführen für bestehende Artikel
2. ✅ Neue Artikel erhalten automatisch Artikelnummern
3. ✅ URLs werden automatisch zu Artikelnummern umgeleitet
4. ✅ Suche funktioniert mit beiden Formaten

---

**Status**: ✅ Aktiviert und funktionsfähig  
**Erstellt**: 2024-12-20

