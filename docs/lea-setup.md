# Lea AI Assistant - Setup Guide

## Schnellstart

### 1. OpenAI API Key erhalten

1. Gehen Sie zu https://platform.openai.com/
2. Erstellen Sie ein Konto oder melden Sie sich an
3. Gehen Sie zu https://platform.openai.com/api-keys
4. Erstellen Sie einen neuen API Key
5. Kopieren Sie den Key (beginnt mit `sk-...`)

### 2. API Key konfigurieren

Fügen Sie den API Key zu Ihrer `.env.local` Datei hinzu:

```bash
OPENAI_API_KEY=sk-Ihr-API-Key-hier
```

### 3. Server neu starten

```bash
# Stoppen Sie den Server (Ctrl+C)
# Starten Sie ihn neu:
npm run dev
```

### 4. Testen

1. Öffnen Sie http://localhost:3002
2. Klicken Sie auf den Lea Chat-Button (unten rechts)
3. Stellen Sie eine Frage
4. Lea sollte antworten!

## Fehlerbehebung

### Lea ist nicht verfügbar (503 Fehler)

**Problem:** `OPENAI_API_KEY` ist nicht gesetzt oder ungültig.

**Lösung:**
1. Prüfen Sie, ob `OPENAI_API_KEY` in `.env.local` vorhanden ist
2. Stellen Sie sicher, dass der Key mit `sk-` beginnt
3. Prüfen Sie, ob der Key in Ihrem OpenAI Account aktiv ist
4. Starten Sie den Server neu

### Lea antwortet nicht

**Mögliche Ursachen:**
1. OpenAI API Credits sind aufgebraucht
2. API Key ist ungültig
3. Netzwerkprobleme

**Lösung:**
1. Prüfen Sie Ihre OpenAI API Credits: https://platform.openai.com/usage
2. Prüfen Sie die Server-Logs auf Fehler
3. Testen Sie den API Key direkt mit curl:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### Conversation History funktioniert nicht

**Problem:** Datenbank-Migration wurde nicht durchgeführt.

**Lösung:**
```bash
npx prisma db push
npx prisma generate
```

## Kosten

- **OpenAI GPT-4o-mini**: ~$0.15 pro 1M Input-Tokens, ~$0.60 pro 1M Output-Tokens
- **Geschätzte Kosten**: ~$0.001-0.01 pro Conversation
- **Monatliche Kosten** (bei 1000 Conversations): ~$1-10

## Fallback-Modus

Wenn `OPENAI_API_KEY` nicht gesetzt ist, verwendet Lea einen Fallback-Modus:
- Lea gibt eine Standard-Antwort zurück
- Benutzer wird an den Support verwiesen
- Keine AI-Funktionalität

## Weitere Informationen

Siehe `docs/lea-ai-assistant.md` für vollständige Dokumentation.

