# Helvenda Design System

## Farben

### Primär
- **Primary**: `#137A5F` - Hauptfarbe für Buttons, Links, Akzente
- **Primary Hover**: `#0f5f4a` - Hover-Zustand

### Akzent
- **Accent**: `#FFD95C` - Für Highlights, Badges, Warnungen

### Neutral
- **White**: `#FFFFFF` - Hintergrund
- **Gray Light**: `#F4F4F4` - Subtile Hintergründe, Borders
- **Gray Medium**: `#C6C6C6` - Icons, Placeholder-Text
- **Gray Dark**: `#3A3A3A` - Haupttext, Überschriften

## Typografie

### Schriftart
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Schriftgrößen
- **Headings**: Semibold (600)
  - H1: 48px (Hero)
  - H2: 32px (Sections)
  - H3: 24px (Subsections)
- **Body**: Regular (400)
  - Large: 20px
  - Base: 16px
  - Small: 14px
  - XSmall: 13px
- **Buttons**: Medium (500)
  - Base: 16px

## Komponenten

### Header
- **Höhe**: 80px (h-20)
- **Sticky**: `sticky top-0 z-50`
- **Shadow**: `0px 2px 12px rgba(0,0,0,0.08)`
- **Background**: White
- **Border**: `border-b border-[#F4F4F4]`

### Kategorie-Kacheln
- **Größe**: 100 × 100px
- **Radius**: 16px
- **Icon**: 40px
- **Text**: 14px, Medium
- **Hover**: Shadow-lg

### Produktkarten
- **Bild**: 260 × 260px (aspect-square)
- **Titel**: 15px, Medium
- **Preis**: 17px, Bold
- **Standort**: 13px, Regular
- **Radius**: 16px
- **Hover**: Scale 1.03 + Shadow-lg

### Buttons
- **Primary**: 
  - Background: `#137A5F`
  - Text: White
  - Radius: 16px
  - Padding: `py-3 px-6`
- **Secondary**:
  - Background: White
  - Border: `#C6C6C6`
  - Text: `#3A3A3A`
  - Radius: 16px

### Inputs
- **Radius**: 16px
- **Border**: `#C6C6C6`
- **Focus**: Ring `#137A5F`
- **Padding**: `px-4 py-3`

### Filter Chips
- **Radius**: 50px (vollständig gerundet)
- **Padding**: `px-4 py-2`
- **Active**: Background `#137A5F`, Text White

### Collections
- **Größe**: 400 × 250px
- **Radius**: 16px
- **Overlay**: Gradient `from-black/60 via-black/20 to-transparent`
- **Text**: 24px, Semibold, bottom-left

## Spacing

- **Section Padding**: `py-12` (48px vertikal)
- **Container Max Width**: `1600px`
- **Container Padding**: `px-4 sm:px-6 lg:px-8`
- **Gap zwischen Elementen**: `gap-4` (16px)

## Shadows

- **Small**: `0px 1px 3px rgba(0, 0, 0, 0.1)`
- **Medium**: `0px 2px 8px rgba(0, 0, 0, 0.1)`
- **Large**: `0px 4px 16px rgba(0, 0, 0, 0.1)`
- **Header**: `0px 2px 12px rgba(0, 0, 0, 0.08)`

## Responsive Breakpoints

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## Animationen

- **Transition**: `transition-all duration-200`
- **Hover Scale**: `scale-[1.03]` für Produktkarten
- **Hover Transform**: `group-hover:scale-110` für Icons

## Best Practices

1. **Konsistenz**: Verwende immer die definierten Komponenten
2. **Spacing**: Nutze das 4px Grid-System
3. **Farben**: Verwende nur die definierten Farben
4. **Typografie**: Halte die Schriftgrößen konsistent
5. **Radius**: 16px für Karten, 50px für Pills
6. **Shadows**: Subtile Schatten für Tiefe














