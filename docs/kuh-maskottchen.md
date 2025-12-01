# Helvenda Kuh-Maskottchen 🐄

## Übersicht

Das Helvenda Kuh-Maskottchen ist ein interaktives, animiertes Element, das die Website freundlicher und einladender macht - ähnlich wie Veepi es mit Tieren macht.

## Komponenten

### 1. `HelvendaCow.tsx` - Basis-Kuh-Komponente

Die Hauptkomponente mit verschiedenen Animationen:

- **idle**: Sanfte Idle-Animation (kontinuierlich)
- **wave**: Winken-Animation
- **jump**: Sprung-Animation
- **happy**: Glückliche Animation mit Lächeln
- **thinking**: Denk-Animation

**Features:**

- Interaktiv (klickbar)
- Hover-Effekte
- Verschiedene Größen (sm, md, lg)
- CSS-Animationen für flüssige Bewegungen

### 2. `FloatingCow.tsx` - Schwebende Kuh

Eine schwebende Kuh, die wie ein Chat-Widget funktioniert:

- Position: bottom-left, bottom-right, top-left, top-right
- Chat-Bubble: Erweitert sich beim Klick
- Zufällige Animationen alle 5 Sekunden
- Glow-Effekt beim Hover
- Badge für neue Nachrichten

### 3. `HeroCow.tsx` - Hero-Section Kuh

Speziell für die Hero-Section:

- Größere Darstellung
- Sparkles-Effekte
- Glow-Effekt
- Call-to-Action Button

## Verwendung

### In der Hero-Section

```tsx
import { HeroCow } from '@/components/mascot/HeroCow'
;<HeroCow />
```

### Als Floating Widget

```tsx
import { FloatingCow } from '@/components/mascot/FloatingCow'
;<FloatingCow position="bottom-left" showChat={true} />
```

### Einzelne Kuh

```tsx
import { HelvendaCow } from '@/components/mascot/HelvendaCow'
;<HelvendaCow
  variant="wave"
  size="md"
  interactive={true}
  onClick={() => console.log('Kuh geklickt!')}
/>
```

## Animationen

### CSS-Animationen (in globals.css)

- `cowIdle`: Sanfte Idle-Bewegung
- `cowJump`: Sprung-Animation
- `cowWave`: Winken-Animation
- `cowHappy`: Glückliche Animation
- `cowFloat`: Schwebende Bewegung
- `smileAppear`: Lächeln erscheint

## Design

### Farben

- Körper: #8B4513 (Braun)
- Kopf: #F5DEB3 (Beige)
- Flecken: #FFFFFF (Weiß, 80% Opacity)
- Hörner: #D2691E (Orange-Braun)
- Nase: #FFB6C1 (Rosa)

### Größen

- **sm**: 64px × 64px
- **md**: 96px × 96px (Standard)
- **lg**: 128px × 128px

## Interaktivität

### Klick-Verhalten

- 1. Klick: Jump-Animation → Happy
- 2. Klick: Wave-Animation
- 3. Klick: Happy-Animation
- Zyklus wiederholt sich

### Hover-Verhalten

- Wave-Animation beim Hover
- Glow-Effekt
- Herz-Icon erscheint

## Platzierung

### Aktuell implementiert:

1. **Hero-Section**: HeroCow (groß, mit Sparkles)
2. **Floating Widget**: FloatingCow (bottom-left, wie Chat-Widget)

### Weitere Möglichkeiten:

- Footer (kleine Kuh)
- Loading-States (animierte Kuh)
- Success-Messages (happy Kuh)
- Error-Pages (traurige Kuh)
- Empty States (denkende Kuh)

## Anpassungen

### Neue Animationen hinzufügen:

1. CSS-Keyframe in `globals.css` erstellen
2. Variant in `HelvendaCow.tsx` hinzufügen
3. SVG-Transformationen anpassen

### Neue Positionen:

- In `FloatingCow.tsx` die `positionClasses` erweitern

### Neue Größen:

- In `HelvendaCow.tsx` die `sizeClasses` erweitern

## Performance

- SVG-basiert (skalierbar, keine Pixelierung)
- CSS-Animationen (GPU-beschleunigt)
- Lazy Loading möglich
- Minimale Bundle-Größe

## Zukunftsideen

- [ ] Sound-Effekte ("Mööö!")
- [ ] Mehr Animationen (tanzen, schlafen, essen)
- [ ] Saisonale Varianten (Weihnachtskuh, Sommerkuh)
- [ ] Interaktive Geschichten
- [ ] Gamification (Kuh-Level, Badges)
- [ ] Verschiedene Kuh-Persönlichkeiten
