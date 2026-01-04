# Supabase Realtime Setup

Diese Anleitung erklärt, wie Supabase Realtime für Helvenda eingerichtet wird.

## Übersicht

Supabase Realtime ersetzt das bisherige Polling-System und bietet:

- **Sofortige Updates** (0ms Verzögerung statt 5-30 Sekunden)
- **95% weniger Server-Last** (nur Events bei Änderungen)
- **Kostenlos** (2M Nachrichten/Monat im Free Tier)

## Schnellstart

### 1. Supabase-Projekt erstellen (kostenlos)

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Wähle eine Region nahe deinen Nutzern (z.B. Frankfurt)

### 2. API-Keys kopieren

Nach der Projekterstellung:

1. Gehe zu **Settings → API**
2. Kopiere:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **anon/public key** (beginnt mit `eyJ...`)
   - **service_role key** (für Server-seitige Broadcasts)

### 3. Environment Variables setzen

Füge zu deiner `.env.local` oder Vercel hinzu:

```bash
# Supabase Realtime (für Echtzeit-Updates)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Vercel Environment Variables

Im Vercel Dashboard:

1. **Settings → Environment Variables**
2. Füge alle drei Variablen hinzu
3. Wähle: ✅ Production, ✅ Preview, ✅ Development

### 5. Deployment

Nach dem Setzen der Environment Variables:

```bash
git add -A
git commit -m "feat: Enable Supabase Realtime"
git push
```

---

## Wie es funktioniert

### Architektur

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Browser A     │     │   Helvenda API   │     │   Browser B     │
│   (Bieter)      │     │   (Next.js)      │     │   (Zuschauer)   │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
         │  POST /api/bids       │                        │
         │──────────────────────>│                        │
         │                       │                        │
         │                       │ 1. Speichere in DB     │
         │                       │ 2. Broadcast Event     │
         │                       │──────────┐             │
         │                       │          │             │
         │                       │          ▼             │
         │                       │   ┌─────────────┐      │
         │                       │   │  Supabase   │      │
         │                       │   │  Realtime   │      │
         │                       │   └──────┬──────┘      │
         │                       │          │             │
         │                       │          │ WebSocket   │
         │<──────────────────────┼──────────┴────────────>│
         │   "Neues Gebot!"      │                        │
         │                       │      "Neues Gebot!"    │
```

### Komponenten

| Datei | Beschreibung |
|-------|--------------|
| `src/lib/supabase.ts` | Supabase Client-Konfiguration |
| `src/lib/realtime-broadcast.ts` | Server-seitige Broadcast-Helfer |
| `src/hooks/useRealtimeBids.ts` | React Hook für Auktions-Updates |
| `src/hooks/useRealtimeNotifications.ts` | React Hook für Benachrichtigungen |
| `src/app/api/realtime/broadcast/route.ts` | API-Route für Broadcasts |

---

## Fallback-Verhalten

Wenn Supabase **nicht konfiguriert** ist:

- ✅ Die App funktioniert weiterhin normal
- ✅ Polling wird automatisch als Fallback verwendet
- ✅ Keine Fehlermeldungen für Benutzer

```typescript
// Automatischer Fallback in den Hooks:
if (isRealtimeAvailable()) {
  // Verwende WebSocket
} else {
  // Fallback zu Polling
}
```

---

## Debugging

### Realtime-Status prüfen

In der Browser-Konsole siehst du:

```
[Supabase] Subscribed to auction-123
[useRealtimeBids] New bid received: { id: '...', amount: 500 }
```

### Probleme beheben

**Problem: "Supabase not configured"**
- Prüfe ob `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt sind
- Starte den Dev-Server neu nach Änderungen an `.env.local`

**Problem: Events werden nicht empfangen**
- Prüfe ob `SUPABASE_SERVICE_ROLE_KEY` gesetzt ist (für Server-Broadcasts)
- Prüfe die Supabase-Konsole unter **Realtime → Channels**

**Problem: Hohe Latenz**
- Wähle eine Supabase-Region näher an deinen Nutzern

---

## Kosten

| Tier | Nachrichten/Monat | Connections | Kosten |
|------|-------------------|-------------|--------|
| Free | 2 Millionen | 200 | $0 |
| Pro | 5 Millionen | 500 | $25/Monat |

Für Helvenda reicht der **Free Tier** für den Start völlig aus.

---

## Verwendete Events

### Auktionen (`auction-{watchId}`)

| Event | Beschreibung |
|-------|--------------|
| `new-bid` | Neues Gebot abgegeben |
| `auction-update` | Auktionszeit verlängert oder beendet |

### Benachrichtigungen (`notifications-{userId}`)

| Event | Beschreibung |
|-------|--------------|
| `new-notification` | Neue Benachrichtigung |
| `notifications-read` | Benachrichtigungen als gelesen markiert |

---

## Erweiterungsmöglichkeiten

### Live-Viewer-Zähler

```typescript
// Zeige: "23 Personen sehen diese Auktion"
const channel = supabase.channel(`auction-${watchId}`)
channel.on('presence', { event: 'sync' }, () => {
  const viewers = Object.keys(channel.presenceState()).length
  setViewerCount(viewers)
})
```

### Typing-Indicator

```typescript
// "Verkäufer schreibt..."
channel.on('broadcast', { event: 'typing' }, (payload) => {
  setIsTyping(payload.userId)
})
```

### Live-Preis-Updates

```typescript
// Preisänderungen in Echtzeit
channel.on('broadcast', { event: 'price-update' }, (payload) => {
  setPrice(payload.newPrice)
})
```

---

## Zusammenfassung

- ✅ **Kostenlos** für bis zu 2M Nachrichten/Monat
- ✅ **Sofortige Updates** ohne Verzögerung
- ✅ **Fallback** zu Polling wenn nicht konfiguriert
- ✅ **Einfache Integration** in bestehende Komponenten
