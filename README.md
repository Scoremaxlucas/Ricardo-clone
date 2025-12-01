# Helvenda - Schweizer Online-Marktplatz

Eine moderne Webapplikation für den Handel mit allen Arten von Artikeln. Der Schweizer Online-Marktplatz für Private und Gewerbetreibende.

## 🚀 Features

- **Universeller Marktplatz** - Handel mit allen Artikelkategorien
- **Responsive Design** - Optimiert für Desktop, Tablet und Mobile
- **Auktionssystem** - Bieten oder Sofortkauf
- **Kategorisierung** - Übersichtliche Struktur für alle Produktgruppen
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

## 🚀 Stripe Setup (Kreditkartenzahlung)

Um Kreditkartenzahlungen zu aktivieren, führen Sie einfach aus:

```bash
npm run setup:stripe
```

Das Script führt Sie durch den Setup-Prozess. Weitere Informationen finden Sie in `docs/stripe-schnellstart.md`.

**Wichtig:** Sie benötigen einen kostenlosen Stripe-Account. Test-Keys erhalten Sie unter: https://dashboard.stripe.com/test/apikeys

## 📦 Installation

### Voraussetzungen

- Node.js 18+
- npm oder yarn
- PostgreSQL (für Produktion)

### Setup

1. **Repository klonen**

```bash
git clone <repository-url>
cd helvenda
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

Die App ist dann unter `http://localhost:3002` verfügbar.

## 🎯 Hauptfunktionen

### Für Käufer

- Durchsuchen von Artikeln nach Kategorie, Marke, Preis, Zustand
- Erweiterte Suchfunktion mit Filtern
- Teilnahme an Auktionen oder Sofortkauf
- Preisvorschläge für Artikel
- Favoriten-System
- Benachrichtigungen für interessante Artikel
- Suchabonnements für automatische Benachrichtigungen

### Für Verkäufer

- Einfaches Hochladen von Artikeln aller Kategorien
- Auktions- oder Sofortkauf-Optionen
- Detaillierte Artikel-Beschreibungen mit mehreren Bildern
- Booster-System für erhöhte Sichtbarkeit
- Verkaufsstatistiken und Übersicht
- Automatische Rechnungsstellung nach Verkauf

### Marktplatz-Features

- **Kategorien**: Umfassende Produktkategorien (Kleidung, Elektronik, Fahrzeuge, Sport, etc.)
- **Erweiterte Suche**: Filter nach Kategorie, Marke, Preis, Zustand, Standort
- **Auktionssystem**: Automatische Verarbeitung bei Auktionsende
- **Sicherheit**: Verifizierte Benutzer, Dispute-System, sichere Zahlungsabwicklung
- **Zahlungsmethoden**: Banküberweisung, TWINT, Kreditkarte
- **Versandoptionen**: Abholung, A-Post, B-Post mit Tracking

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
docker build -t helvenda .
docker run -p 3002:3002 helvenda
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

**Helvenda** - Der Schweizer Online-Marktplatz für alle.
