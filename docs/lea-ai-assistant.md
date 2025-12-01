# Lea AI Assistant - Dokumentation

## Übersicht

Lea ist der KI-gestützte Assistent von Helvenda, ähnlich wie bei Ricardo.ch. Sie hilft Benutzern bei Fragen zu Produkten, Verkaufsprozess, Kaufprozess und allgemeinen Fragen zu Helvenda.

## Features

- ✅ **24/7 Verfügbarkeit** - Lea ist immer verfügbar
- ✅ **Kontextbewusst** - Lea kennt das aktuelle Produkt, den Benutzer und die Seite
- ✅ **Conversation History** - Lea erinnert sich an vorherige Nachrichten in der Session
- ✅ **Mehrsprachig** - Antwortet auf Deutsch (Schweizerdeutsch ok)
- ✅ **Freundlich und professionell** - Lea ist hilfsbereit und präzise

## Technologie

- **OpenAI GPT-4o-mini** - Für kostengünstige und schnelle Antworten
- **Prisma** - Für Conversation History
- **Next.js API Routes** - Für Backend-Logik
- **React** - Für UI-Komponenten

## Installation

### 1. OpenAI API Key konfigurieren

Fügen Sie Ihren OpenAI API Key zur `.env.local` hinzu:

```bash
OPENAI_API_KEY=sk-...
```

### 2. Datenbank-Migration

Führen Sie die Prisma-Migration aus:

```bash
npx prisma generate
npx prisma db push
```

### 3. Server starten

```bash
npm run dev
```

## Verwendung

### Für Benutzer

Lea ist auf allen Seiten verfügbar als **floating Chat-Button** (unten rechts).

1. Klicken Sie auf den Chat-Button
2. Stellen Sie Ihre Frage
3. Lea antwortet sofort
4. Die Conversation wird gespeichert

### Für Entwickler

#### Lea auf Produktseiten mit Kontext

```tsx
import { LeaChat } from '@/components/lea/LeaChat'

// In einer Produktseite
;<LeaChat productId={watch.id} />
```

#### Lea API direkt verwenden

```typescript
const response = await fetch('/api/ai/lea/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-product-id': productId, // Optional: für Produkt-Kontext
  },
  body: JSON.stringify({
    message: 'Wie funktioniert der Versand?',
    conversationId: conversationId, // Optional: für History
    productId: productId, // Optional: für Produkt-Kontext
  }),
})

const data = await response.json()
console.log(data.message) // Lea's Antwort
```

## Kontext

Lea hat Zugriff auf folgende Kontext-Informationen:

- **Benutzer-Info**: Name, Email (wenn eingeloggt)
- **Produkt-Info**: Titel, Preis, Zustand, Verkäufer (wenn auf Produktseite)
- **Seiten-Kontext**: Aktuelle Seite, URL
- **Conversation History**: Vorherige Nachrichten in der Session

## System Prompt

Lea verwendet einen System-Prompt, der folgende Informationen enthält:

- Helvenda ist ein Schweizer Online-Marktplatz
- Verfügbare Zahlungsmethoden (Banküberweisung, Kreditkarte, TWINT, PayPal)
- Versandoptionen (A-Post, B-Post, Abholung)
- Preise sind in CHF
- Aktuelles Produkt (falls vorhanden)
- Benutzer-Info (falls eingeloggt)

## Conversation Management

- Jede Conversation wird in der Datenbank gespeichert
- Die letzten 10 Nachrichten werden für Kontext verwendet
- Conversations sind mit Benutzern verknüpft (optional für Gäste)

## Kosten

- **OpenAI GPT-4o-mini**: ~$0.15 pro 1M Input-Tokens, ~$0.60 pro 1M Output-Tokens
- **Geschätzte Kosten**: ~$0.001-0.01 pro Conversation (abhängig von Länge)

## Customization

### System Prompt anpassen

Bearbeiten Sie `buildSystemPrompt()` in `/src/app/api/ai/lea/chat/route.ts`:

```typescript
function buildSystemPrompt(context: LeaContext): string {
  return `Du bist Lea, der freundliche KI-Assistent...
  // Hier können Sie den Prompt anpassen
  `
}
```

### UI anpassen

Bearbeiten Sie `/src/components/lea/LeaChat.tsx`:

- Farben ändern (Primary-600, etc.)
- Größe anpassen (w-96, h-[600px])
- Position ändern (bottom-6 right-6)

## Troubleshooting

### Lea antwortet nicht

1. Prüfen Sie, ob `OPENAI_API_KEY` in `.env.local` gesetzt ist
2. Prüfen Sie die Server-Logs auf Fehler
3. Prüfen Sie Ihre OpenAI API Credits

### Conversation History funktioniert nicht

1. Prüfen Sie, ob die Datenbank-Migration durchgeführt wurde
2. Prüfen Sie die Prisma-Schema-Datei auf `Conversation` und `ConversationMessage` Models

### Lea antwortet auf Englisch

Der System-Prompt sollte explizit "ANTWORTE IMMER AUF DEUTSCH!" enthalten. Prüfen Sie die `buildSystemPrompt()` Funktion.

## Erweiterte Features (Zukünftig)

- [ ] Fallback zu menschlichem Support
- [ ] Multi-Language Support (FR, IT)
- [ ] Voice Input/Output
- [ ] Proaktive Nachrichten (z.B. "Hast du Fragen zu diesem Produkt?")
- [ ] Analytics und Feedback-System
- [ ] Admin-Dashboard für Lea-Statistiken

## Support

Bei Fragen oder Problemen:

- Prüfen Sie die Server-Logs
- Prüfen Sie die OpenAI API Dokumentation
- Kontaktieren Sie den System-Administrator
