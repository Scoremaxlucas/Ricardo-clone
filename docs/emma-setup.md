# Emma AI Assistant - Setup Guide

## ⚡ Schnellstart

### 1. OpenAI API Key erhalten

1. Gehen Sie zu https://platform.openai.com/
2. Erstellen Sie ein Konto oder melden Sie sich an
3. Gehen Sie zu https://platform.openai.com/api-keys
4. Klicken Sie auf "Create new secret key"
5. Kopieren Sie den Key (beginnt mit `sk-...`)
   - ⚠️ **WICHTIG:** Speichern Sie den Key sofort, er wird nur einmal angezeigt!

### 2. API Key in .env.local konfigurieren

Öffnen Sie `.env.local` im Projekt-Root und fügen Sie hinzu:

```bash
OPENAI_API_KEY=sk-Ihr-API-Key-hier
```

**Beispiel:**

```bash
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### 3. Server neu starten

```bash
# Stoppen Sie den Server (Ctrl+C im Terminal)
# Starten Sie ihn neu:
npm run dev
```

### 4. Testen

1. Öffnen Sie http://localhost:3002
2. Klicken Sie auf den **Emma Chat-Button** (unten rechts, grüner Button)
3. Stellen Sie eine Frage, z.B.:
   - "Wie funktioniert der Versand?"
   - "Welche Zahlungsmethoden gibt es?"
   - "Wie verkaufe ich einen Artikel?"

## ✅ Überprüfung

### Prüfen ob API Key gesetzt ist:

```bash
# Im Terminal:
grep OPENAI_API_KEY .env.local
```

Sollte den Key anzeigen (ohne den vollständigen Wert aus Sicherheitsgründen).

### Prüfen ob Server läuft:

```bash
npm run dev:status
```

### Prüfen ob API funktioniert:

Öffnen Sie die Browser-Konsole (F12) und schauen Sie nach Fehlern. Wenn alles funktioniert, sollte Emma antworten!

## 🔧 Fehlerbehebung

### Problem: "Emma ist derzeit nicht verfügbar"

**Ursache:** `OPENAI_API_KEY` ist nicht gesetzt oder ungültig.

**Lösung:**

1. Prüfen Sie `.env.local` - ist `OPENAI_API_KEY` vorhanden?
2. Stellen Sie sicher, dass der Key mit `sk-` beginnt
3. Prüfen Sie, dass keine Leerzeichen vor/nach dem Key sind
4. Starten Sie den Server neu

### Problem: "Failed to load resource: 500"

**Ursache:** API Key ist ungültig oder OpenAI API ist nicht erreichbar.

**Lösung:**

1. Prüfen Sie Ihre OpenAI API Credits: https://platform.openai.com/usage
2. Prüfen Sie, ob der API Key aktiv ist
3. Testen Sie den API Key direkt:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Problem: Emma antwortet nicht

**Mögliche Ursachen:**

1. Server-Logs prüfen (im Terminal wo `npm run dev` läuft)
2. Browser-Konsole prüfen (F12)
3. Netzwerkprobleme

## 💰 Kosten

- **OpenAI GPT-4o-mini**:
  - Input: ~$0.15 pro 1M Tokens
  - Output: ~$0.60 pro 1M Tokens
- **Geschätzte Kosten pro Conversation**: ~$0.001-0.01
- **Monatliche Kosten** (bei 1000 Conversations): ~$1-10

## 📝 Weitere Informationen

Siehe `docs/lea-ai-assistant.md` für vollständige Dokumentation (wird zu `emma-ai-assistant.md` umbenannt).
