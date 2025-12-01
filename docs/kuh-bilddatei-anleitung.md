# Kuh-Maskottchen Bilddatei - Anleitung

## Wo finde ich eine passende Kuh-Illustration?

### Option 1: Kostenlose Ressourcen

1. **Unsplash** (https://unsplash.com)
   - Suche nach "cow illustration" oder "cow mascot"
   - Hochwertige, kostenlose Bilder

2. **Pexels** (https://www.pexels.com)
   - Ähnlich wie Unsplash
   - Viele Illustrationen verfügbar

3. **Pixabay** (https://pixabay.com)
   - Kostenlose Vektorgrafiken und Illustrationen
   - Suche nach "cow character" oder "cow mascot"

4. **Flaticon** (https://www.flaticon.com)
   - Viele Kuh-Icons und Illustrationen
   - Einige kostenlos, Premium für kommerzielle Nutzung

### Option 2: KI-generierte Bilder

1. **Midjourney** (https://www.midjourney.com)
   - Prompt: "stylized realistic cow mascot, friendly, professional, Veepi style, white background, high quality illustration"

2. **DALL-E** (https://openai.com/dall-e-2)
   - Prompt: "cute stylized cow mascot character, professional illustration, friendly expression, Veepi style"

3. **Stable Diffusion** (https://stability.ai)
   - Ähnliche Prompts wie oben

### Option 3: Professionelle Designer beauftragen

1. **Fiverr** (https://www.fiverr.com)
   - Suche nach "mascot design" oder "character illustration"
   - Preise: $20-100+

2. **99designs** (https://www.99designs.com)
   - Professionelle Designer
   - Preise: $200-500+

3. **Behance** (https://www.behance.net)
   - Suche nach Designern mit "mascot" Portfolio
   - Direkter Kontakt möglich

## Bildanforderungen

### Technische Spezifikationen:

- **Format**: PNG mit transparentem Hintergrund (empfohlen) oder SVG
- **Auflösung**:
  - Minimum: 400x400px
  - Empfohlen: 800x800px oder höher (für Retina-Displays)
- **Hintergrund**: Transparent (Alpha-Kanal)
- **Stil**: Stilisiert-realistisch (wie Veepi), nicht zu cartoonhaft, nicht fotorealistisch
- **Farben**: Schwarz-Weiß Kuh mit freundlichem Ausdruck

### Stil-Richtlinien (basierend auf Veepi):

- ✅ Stilisiert-realistisch (Balance zwischen Realismus und Stilisierung)
- ✅ Freundlicher, einladender Ausdruck
- ✅ Große, ausdrucksstarke Augen
- ✅ Weiche, natürliche Formen
- ✅ Professionelle Qualität
- ❌ Nicht zu cartoonhaft
- ❌ Nicht fotorealistisch
- ❌ Keine übertriebenen Features

## Installation

1. **Bilddatei platzieren**:

   ```
   public/images/helvenda-cow.png
   ```

2. **Dateiname**: Die Komponente erwartet `helvenda-cow.png` im Ordner `/public/images/`

3. **Falls anderer Dateiname**: Ändere in `HelvendaCow.tsx` die Zeile:
   ```typescript
   src = '/images/helvenda-cow.png'
   ```
   zu deinem Dateinamen.

## Beispiel-Prompts für KI-Generierung

### Midjourney:

```
stylized realistic cow mascot character, friendly expression, large expressive eyes, black and white Holstein cow pattern, professional illustration style similar to Veepi mascot, soft shadows, high quality, white background, transparent background --ar 1:1 --v 6
```

### DALL-E:

```
A stylized realistic cow mascot character illustration. Friendly expression with large expressive brown eyes. Black and white Holstein cow pattern. Professional quality similar to Veepi style. Soft lighting, subtle shadows. White background, transparent. High resolution.
```

## Temporäre Lösung

Falls du noch keine Bilddatei hast, kannst du:

1. Eine temporäre Platzhalter-Kuh von einer der oben genannten Quellen verwenden
2. Die SVG-Version vorübergehend wieder aktivieren
3. Ein einfaches Kuh-Icon als Platzhalter verwenden

## Nächste Schritte

1. Wähle eine der Optionen oben aus
2. Lade die Bilddatei herunter oder erstelle sie
3. Platziere sie in `public/images/helvenda-cow.png`
4. Die Komponente wird automatisch das Bild verwenden

Falls du Hilfe beim Finden oder Erstellen der Bilddatei brauchst, lass es mich wissen!
