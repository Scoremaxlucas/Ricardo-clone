# 🎯 Dynamisches Kategorie-System für Helvenda

## Übersicht

Das neue System ermöglicht es, **unterschiedliche Formulare** für verschiedene Artikelkategorien anzuzeigen.

---

## 📦 Neue Komponenten

### 1. **CategorySelector.tsx**

- Zeigt alle Kategorien als auswählbare Karten
- Nutzer wählt die Kategorie am Anfang des Verkaufsprozesses

### 2. **CategoryFields.tsx**

- Rendert **kategorie-spezifische Felder**
- Unterschiedliche Felder für Elektronik, Mode, Möbel, Fahrzeuge, etc.

---

## 🔧 Integration in die Sell-Page

Um das System zu integrieren, fügen Sie in `/src/app/sell/page.tsx` hinzu:

### **Schritt 1: Imports**

```typescript
import { CategorySelector } from '@/components/forms/CategorySelector'
import { CategoryFields } from '@/components/forms/CategoryFields'
```

### **Schritt 2: State für Kategorie**

```typescript
const [selectedCategory, setSelectedCategory] = useState('')
```

### **Schritt 3: Im Formular einfügen**

**VOR allen anderen Feldern:**

```tsx
<CategorySelector
  selectedCategory={selectedCategory}
  onChange={setSelectedCategory}
/>

{selectedCategory && (
  <>
    {/* Basis-Felder (für alle Kategorien) */}
    <div>
      <label>Titel *</label>
      <input name="title" ... />
    </div>

    <div>
      <label>Beschreibung *</label>
      <textarea name="description" ... />
    </div>

    <div>
      <label>Preis *</label>
      <input type="number" name="price" ... />
    </div>

    {/* Kategorie-spezifische Felder */}
    <CategoryFields
      category={selectedCategory}
      formData={formData}
      onChange={handleInputChange}
    />

    {/* Bilder, Versand, etc. */}
  </>
)}
```

---

## 📋 Kategorie-spezifische Felder

### **Elektronik** (elektronik)

- ✅ Hersteller/Marke
- ✅ Modell
- ✅ Farbe
- ✅ Speicher/Kapazität
- ✅ Garantie
- ✅ Originalverpackung

### **Mode** (mode)

- ✅ Marke
- ✅ Größe
- ✅ Farbe
- ✅ Material
- ✅ Geschlecht (Damen/Herren/Unisex/Kinder)

### **Möbel/Haus & Garten** (haus-garten, moebel)

- ✅ Material
- ✅ Farbe
- ✅ Maße (L x B x H)
- ✅ Gewicht
- ✅ Selbstabholung erforderlich?

### **Fahrzeuge** (fahrzeuge, autos)

- ✅ Marke
- ✅ Modell
- ✅ Erstzulassung
- ✅ Kilometerstand
- ✅ Treibstoff
- ✅ Getriebe

### **Sammeln & Seltenes** (sammeln, kunst)

- ✅ Künstler/Hersteller
- ✅ Entstehungsjahr
- ✅ Echtheitszertifikat

### **Sonstiges** (alle anderen)

- ✅ Marke/Hersteller
- ✅ Modell
- ✅ Farbe
- ✅ Material

---

## 💡 Vorteile

### **Für Verkäufer:**

- ✅ **Relevante Felder** - Nur was für die Kategorie wichtig ist
- ✅ **Einfach** - Klar strukturiert
- ✅ **Schnell** - Weniger irrelevante Felder

### **Für Käufer:**

- ✅ **Bessere Infos** - Kategorie-spezifische Details
- ✅ **Vergleichbar** - Einheitliche Felder pro Kategorie
- ✅ **Professionell** - Strukturierte Anzeigen

---

## 🎨 UX-Flow

1. **Nutzer kommt auf /sell**
2. **Wählt Kategorie** aus (große Karten mit Icons)
3. **Formular erscheint** mit:
   - Basis-Felder (Titel, Beschreibung, Preis, Bilder)
   - Kategorie-spezifische Felder
   - Versand-Optionen
   - Booster-Optionen
4. **Submit** - Artikel wird erstellt

---

## 🔄 Erweiterung

Um neue Kategorien hinzuzufügen:

1. **CategorySelector.tsx** - Kategorie zur Liste hinzufügen
2. **CategoryFields.tsx** - Neue if-Bedingung mit Feldern

Beispiel:

```typescript
if (category === 'neue-kategorie') {
  return (
    <div className="space-y-6">
      <h3>Kategorie-Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ihre spezifischen Felder */}
      </div>
    </div>
  )
}
```

---

## 📊 Datenbank

Die Felder werden als JSON oder in flexiblen Feldern gespeichert:

- Existierende Felder (`brand`, `model`, `year`, etc.) werden wiederverwendet
- Neue Felder (wie `color`, `size`, `mileage`) können als zusätzliche Spalten oder in JSON gespeichert werden

**Das aktuelle Watch-Schema funktioniert bereits** - Sie können die Felder einfach anders nutzen:

- `brand` = Marke (für alles)
- `model` = Modell (für alles)
- `material` = Material (für alles)
- `year` = Jahr/Baujahr (für alles)

---

## ✅ Status

- ✅ **CategorySelector** erstellt
- ✅ **CategoryFields** erstellt
- ⏸️ **Integration in Sell-Page** - Bereit zur Implementierung

Die Komponenten sind fertig und funktionsfähig. Sie können sie jetzt in die Sell-Page integrieren!
