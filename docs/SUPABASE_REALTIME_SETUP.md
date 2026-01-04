# Supabase Realtime Setup

Diese Anleitung erklärt, wie Supabase Realtime für Helvenda eingerichtet wird.

## Überblick

Supabase Realtime ersetzt das bisherige Polling-System für:
- **Gebote**: Sofortige Updates bei neuen Geboten
- **Benachrichtigungen**: Sofortige Updates bei neuen Notifications
- **Auktions-Updates**: Sofortige Updates bei Zeitverlängerungen

### Vorteile

| Feature | Vorher (Polling) | Nachher (Realtime) |
|---------|-----------------|-------------------|
| Verzögerung | 5-30 Sekunden | ~0ms (sofort) |
| API-Calls | ~95/Sekunde (1000 User) | ~1-5/Sekunde |
| Server-Last | Hoch | Niedrig |
| UX | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## Setup-Schritte

### 1. Supabase-Projekt erstellen (Kostenlos)

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Wähle eine Region (z.B. Frankfurt für Europa)
4. Warte bis das Projekt erstellt ist (~2 Minuten)

### 2. API-Keys kopieren

1. Gehe zu **Settings → API**
2. Kopiere:
   - **Project URL** (z.B. `https://abcdefgh.supabase.co`)
   - **anon public** Key
   - **service_role** Key (für Server-Broadcasting)

### 3. Environment Variables setzen

#### Lokal (.env.local)

```bash
# Supabase Realtime (optional - System funktioniert auch ohne)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Vercel

1. Gehe zu **Vercel Dashboard → Settings → Environment Variables**
2. Füge hinzu:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### 4. Testen

Nach dem Setup sollten Gebote und Benachrichtigungen sofort erscheinen ohne Seitenaktualisierung.

## Architektur

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser A     │     │   Helvenda API  │     │   Browser B     │
│  (Bieter)       │     │   (Next.js)     │     │  (Zuschauer)    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │ 1. POST /api/bids     │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │                       │ 2. DB Insert          │
         │                       │    (Prisma)           │
         │                       │                       │
         │                       │ 3. Broadcast Event    │
         │                       │    (Supabase)         │
         │                       │───────────────────────┼───────────>
         │                       │                       │
         │                       │                       │ 4. WebSocket
         │                       │                       │    Event
         │                       │                       │
         │ 5. Response           │                       │ 5. UI Update
         │<──────────────────────│                       │    (sofort!)
```

## Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/lib/supabase.ts` | Supabase Client & Helpers |
| `src/lib/realtime-broadcast.ts` | Server-seitige Broadcast-Funktionen |
| `src/hooks/useRealtimeBids.ts` | Hook für Gebots-Updates |
| `src/hooks/useRealtimeNotifications.ts` | Hook für Notification-Updates |
| `src/app/api/realtime/broadcast/route.ts` | API-Route für Broadcasting |

## Verwendung

### Gebote (automatisch)

Die `BidComponent` verwendet automatisch Realtime wenn konfiguriert:

```tsx
// src/components/bids/BidComponent.tsx
const { bids, highestBid, isConnected, isUsingRealtime } = useRealtimeBids({
  watchId: itemId,
  onNewBid: (bid) => console.log('Neues Gebot!', bid),
  onAuctionUpdate: (update) => console.log('Auktion aktualisiert!', update),
})
```

### Benachrichtigungen (automatisch)

Der `Header` verwendet automatisch Realtime wenn konfiguriert:

```tsx
// src/components/layout/Header.tsx
const { unreadCount, isConnected } = useRealtimeNotifications({
  userId,
  onNewNotification: (n) => console.log('Neue Benachrichtigung!', n),
})
```

### Manuelles Broadcasting (Server-seitig)

```typescript
import { broadcastBidEvent, broadcastNotification } from '@/lib/realtime-broadcast'

// Nach DB-Insert:
await broadcastBidEvent(watchId, {
  id: bid.id,
  amount: bid.amount,
  userId: user.id,
  userName: user.name,
  createdAt: new Date(),
})
```

## Fallback

Wenn Supabase nicht konfiguriert ist, fällt das System automatisch auf Polling zurück:

- **Gebote**: Polling alle 5 Sekunden
- **Benachrichtigungen**: Polling alle 30 Sekunden

Dies stellt sicher, dass die Plattform auch ohne Supabase funktioniert.

## Kosten

| Plan | Kosten | Limits |
|------|--------|--------|
| Free | $0/Monat | 2M Nachrichten/Monat, 200 Connections |
| Pro | $25/Monat | 5M Nachrichten, 500 Connections |

Für die meisten Anwendungsfälle reicht der kostenlose Plan.

## Troubleshooting

### Realtime funktioniert nicht

1. Prüfe Environment Variables:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

2. Prüfe Browser Console:
   ```
   [Supabase] Subscribed to auction-123
   ```

3. Prüfe Server Logs:
   ```
   [Realtime] Broadcast new-bid to auction-123
   ```

### Fallback auf Polling

Wenn in der Console steht:
```
[useRealtimeBids] Using polling fallback
```

Dann ist Supabase nicht konfiguriert. Das System funktioniert trotzdem, aber mit Polling.

## Nächste Schritte

1. **Supabase-Projekt erstellen** (kostenlos)
2. **Environment Variables setzen**
3. **Testen**: Gebote sollten sofort erscheinen

Bei Fragen: support@helvenda.ch
