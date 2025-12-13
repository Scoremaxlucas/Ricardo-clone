# KI-Suchassistent Setup & Konfiguration

## Übersicht

Der KI-Suchassistent nutzt OpenAI GPT-4o, um natürliche Sprache zu verstehen und intelligente Filter für die Suche zu extrahieren. Er bietet eine fantastische User Experience durch:

- ✅ Verstehen natürlicher Sprache
- ✅ Automatische Filter-Extraktion (Marke, Preis, Kategorie, Zustand, etc.)
- ✅ Konversations-Kontext
- ✅ Direkte Anzeige von Ergebnissen im Chat
- ✅ Automatische URL-Aktualisierung

## Schritt 1: OpenAI API Key konfigurieren

### 1.1 API Key erhalten

1. Gehe zu [OpenAI Platform](https://platform.openai.com/)
2. Erstelle ein Account oder logge dich ein
3. Gehe zu [API Keys](https://platform.openai.com/api-keys)
4. Erstelle einen neuen API Key
5. Kopiere den Key (wird nur einmal angezeigt!)

### 1.2 API Key in Umgebungsvariablen speichern

Füge den API Key zu deiner `.env` oder `.env.local` Datei hinzu:

```bash
# .env.local
OPENAI_API_KEY=sk-proj-dein-api-key-hier
```

**WICHTIG:**

- Füge `.env.local` zu `.gitignore` hinzu (falls noch nicht vorhanden)
- Teile deinen API Key niemals öffentlich
- Für Production: Nutze Vercel Environment Variables

### 1.3 Vercel Environment Variables (Production)

1. Gehe zu deinem Vercel Projekt
2. Settings → Environment Variables
3. Füge hinzu:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** Dein API Key
   - **Environment:** Production, Preview, Development

## Schritt 2: Testen

### 2.1 Lokal testen

1. Starte den Development Server:

   ```bash
   npm run dev
   ```

2. Gehe zu `/search`

3. Klicke auf den Floating Button (unten rechts mit Sparkles-Icon)

4. Teste verschiedene Anfragen:
   - "Zeig mir Rolex Uhren unter 5000 CHF"
   - "Ich suche ein Motorrad in Zürich"
   - "Was hast du für Laptops?"
   - "iPhone 15 Pro Max neu"
   - "Auktionen für Uhren"

### 2.2 Erwartetes Verhalten

✅ **KI-Assistent antwortet freundlich**
✅ **Filter werden automatisch extrahiert**
✅ **Artikel werden direkt im Chat angezeigt**
✅ **Search-Seite wird automatisch aktualisiert**

## Schritt 3: Fallback-Verhalten

Falls kein OpenAI API Key konfiguriert ist, nutzt der Assistent **Pattern-Matching** als Fallback:

- Erkennt Marken aus der Nachricht
- Extrahiert Preise (unter/bis/über/ab)
- Erkennt Kategorien durch Keywords
- Funktioniert, aber weniger intelligent als mit OpenAI

## Schritt 4: Kosten & Limits

### OpenAI GPT-4o Pricing (Stand 2024)

- **Input:** ~$2.50 pro 1M Tokens
- **Output:** ~$10.00 pro 1M Tokens
- **Typische Anfrage:** ~500-1000 Tokens
- **Kosten pro Anfrage:** ~$0.001-0.002 (sehr günstig!)

### Empfehlungen

1. **Setze Limits** in OpenAI Dashboard:
   - Monthly Budget Limit
   - Rate Limits

2. **Monitoring:**
   - Überwache API-Nutzung im OpenAI Dashboard
   - Logge Fehler in deiner Anwendung

3. **Optimierung:**
   - Nutze `temperature: 0.3` für präzise Ergebnisse
   - Limit `max_tokens` auf 500
   - Cache häufige Anfragen (optional)

## Schritt 5: Erweiterte Konfiguration

### 5.1 System-Prompt anpassen

Bearbeite `src/app/api/ai/search-assistant/route.ts`:

```typescript
const systemPrompt = `Dein angepasster Prompt...`
```

### 5.2 Model wechseln

Für günstigere Optionen (aber weniger präzise):

```typescript
model: 'gpt-4o-mini' // Günstiger, aber weniger präzise
```

### 5.3 Temperature anpassen

```typescript
temperature: 0.3 // Niedrig = präziser (empfohlen)
temperature: 0.7 // Höher = kreativer
```

## Troubleshooting

### Problem: "OpenAI API Key nicht konfiguriert"

**Lösung:**

1. Prüfe `.env.local` Datei
2. Stelle sicher, dass `OPENAI_API_KEY` gesetzt ist
3. Starte Server neu: `npm run dev`

### Problem: "Rate limit exceeded"

**Lösung:**

1. Prüfe OpenAI Dashboard für Limits
2. Implementiere Rate Limiting (optional)
3. Nutze Fallback Pattern-Matching

### Problem: "Fehler bei Search-API"

**Lösung:**

1. Prüfe ob `/api/watches/search` funktioniert
2. Prüfe Server-Logs
3. Stelle sicher, dass `NEXT_PUBLIC_BASE_URL` korrekt ist

### Problem: Filter werden nicht korrekt extrahiert

**Lösung:**

1. Verbessere System-Prompt
2. Prüfe ob Marken/Kategorien in Listen vorhanden sind
3. Teste mit verschiedenen Formulierungen

## Best Practices

1. **User Experience:**
   - Zeige Loading-States während API-Calls
   - Gebe hilfreiche Fehlermeldungen
   - Stelle präzise Klärungsfragen

2. **Performance:**
   - Nutze Debouncing für Input (bereits implementiert)
   - Cache häufige Anfragen (optional)
   - Limit Anzahl der Ergebnisse im Chat

3. **Sicherheit:**
   - Validiere User-Input
   - Rate Limiting implementieren (optional)
   - Sanitize Filter-Parameter

4. **Monitoring:**
   - Logge API-Calls
   - Track User-Interaktionen
   - Überwache Fehlerrate

## Nächste Schritte

- [ ] OpenAI API Key konfigurieren
- [ ] Lokal testen
- [ ] Production Deployment
- [ ] Monitoring einrichten
- [ ] User Feedback sammeln

## Support

Bei Fragen oder Problemen:

1. Prüfe Server-Logs
2. Prüfe OpenAI Dashboard
3. Teste mit verschiedenen Anfragen
4. Nutze Fallback Pattern-Matching als Vergleich
