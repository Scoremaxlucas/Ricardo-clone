# WatchMarket - Luxusuhren Plattform

Eine moderne Webapplikation für den Handel mit Luxusuhren, Vintage-Uhren und seltenen Zeitmessern. Inspiriert von Ricardo.ch, aber spezialisiert auf Uhren.

## 🚀 Features

- **Uhren-spezialisierte Plattform** - Fokus auf Luxusuhren, Vintage-Uhren und seltene Zeitmesser
- **Responsive Design** - Optimiert für Desktop, Tablet und Mobile
- **Auktionssystem** - Bieten Sie auf seltene Uhren
- **Marken-Filter** - Rolex, Patek Philippe, Omega, Audemars Piguet und mehr
- **User Management** - Registrierung, Anmeldung, Profil
- **Mobile App Ready** - Vorbereitet für React Native Mobile App

## 🛠 Technologie-Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **Database**: Prisma (PostgreSQL)
- **Mobile**: React Native (geplant)

## 📦 Installation

### Voraussetzungen
- Node.js 18+ 
- npm oder yarn
- PostgreSQL (für Produktion)

### Setup

1. **Repository klonen**
```bash
git clone <repository-url>
cd ricardo-clone
```

2. **Dependencies installieren**
```bash
npm install
# oder
yarn install
```

3. **Umgebungsvariablen konfigurieren**
```bash
cp .env.example .env.local
```

4. **Datenbank einrichten**
```bash
npx prisma generate
npx prisma db push
```

5. **Entwicklungsserver starten**
```bash
npm run dev
# oder
yarn dev
```

Die App ist dann unter `http://localhost:3000` verfügbar.

## 🎯 Hauptfunktionen

### Für Käufer
- Durchsuchen von Uhren nach Marke, Preis, Zustand
- Teilnahme an Auktionen
- Favoriten-System
- Benachrichtigungen für interessante Uhren

### Für Verkäufer
- Einfaches Hochladen von Uhren
- Auktions- oder Sofortkauf-Optionen
- Detaillierte Uhren-Beschreibungen
- Authentizitäts-Zertifikate

### Uhren-spezifische Features
- **Marken-Filter**: Rolex, Patek Philippe, Omega, etc.
- **Zustand-Bewertung**: Neu, Sehr gut, Gut, Vintage
- **Jahrgang-Filter**: Von Vintage bis Neu
- **Material-Filter**: Stahl, Gold, Titan, etc.
- **Komplikationen**: Chronograph, GMT, Perpetual Calendar

## 📱 Mobile App

Die App ist vorbereitet für eine React Native Mobile App:
- Geteilte Komponenten zwischen Web und Mobile
- Responsive Design für alle Bildschirmgrößen
- Touch-optimierte Navigation

## 🚀 Deployment

### Vercel (Empfohlen)
```bash
npm run build
vercel --prod
```

### Docker
```bash
docker build -t watchmarket .
docker run -p 3000:3000 watchmarket
```

## 📁 Projektstruktur

```
src/
├── app/                 # Next.js App Router
├── components/          # React Komponenten
│   ├── layout/         # Header, Footer, Navigation
│   ├── home/           # Homepage Komponenten
│   ├── ui/             # Wiederverwendbare UI-Komponenten
│   └── forms/          # Formulare
├── lib/                # Utility-Funktionen
├── types/              # TypeScript Typen
├── hooks/              # Custom React Hooks
└── store/              # Zustand State Management
```

## 🔧 Entwicklung

### Code-Qualität
- ESLint für Code-Linting
- Prettier für Code-Formatierung
- TypeScript für Typsicherheit

### Testing
```bash
npm run test
npm run test:watch
```

### Build
```bash
npm run build
npm run start
```

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Dokumentation durchlesen
- Community-Forum besuchen

## 📄 Lizenz

MIT License - siehe LICENSE Datei für Details.

---

**WatchMarket** - Die führende Plattform für Luxusuhren und seltene Zeitmesser.

