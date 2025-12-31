# 🔧 Environment Variables Setup - Helvenda

## 📋 Übersicht

Helvenda verwendet zentrale Environment-Variablen für Debug-Steuerung und Domain-Konfiguration.

## ✅ Neue Variablen (Empfohlen)

### 1. `DEBUG` - Explizite Debug-Steuerung

**Zweck:**
- Aktiviert/deaktiviert Debug-Logging unabhängig von `NODE_ENV`
- Ermöglicht Debugging in Production (z.B. für Troubleshooting)
- Steuert detaillierte Fehlermeldungen und Stack-Traces

**Werte:**
- `true` - Debug-Modus aktiviert
- `false` - Debug-Modus deaktiviert (Standard)

**Verwendung:**
```typescript
import { isDebug, shouldShowDetailedErrors, shouldLogStackTraces } from '@/lib/env'

// Prüfe ob Debug aktiv ist
if (isDebug()) {
  console.log('Debug info:', detailedData)
}

// Prüfe ob detaillierte Fehler angezeigt werden sollen
if (shouldShowDetailedErrors()) {
  response.error = error.message
}

// Prüfe ob Stack-Traces geloggt werden sollen
if (shouldLogStackTraces()) {
  console.error('Stack:', error.stack)
}
```

**Vercel Setup:**
```
Key: DEBUG
Value: true (für Development/Preview)
Value: false (für Production)
Umgebungen: ✅ Production, ✅ Preview, ✅ Development
```

---

### 2. `APP_DOMAIN` - Explizite App-Domain

**Zweck:**
- Definiert die Haupt-Domain der Anwendung
- Wird verwendet für:
  - E-Mail-Links
  - Stripe Redirect-URLs
  - OAuth Callbacks
  - Cookie-Domains

**Priorität (Fallback-Kette):**
1. `APP_DOMAIN` (höchste Priorität)
2. `NEXT_PUBLIC_APP_URL`
3. `NEXT_PUBLIC_BASE_URL`
4. `NEXTAUTH_URL`
5. `VERCEL_URL` (Preview URLs)
6. Request URL (aus Request-Header)
7. `http://localhost:3000` (Development Fallback)

**Verwendung:**
```typescript
import { getAppDomain } from '@/lib/env'

// In API Routes:
const baseUrl = getAppDomain(request)
const emailLink = `${baseUrl}/verify-email?token=${token}`

// In Stripe:
returnUrl: `${baseUrl}/orders/success`
```

**Vercel Setup:**
```
Key: APP_DOMAIN
Value: https://www.helvenda.ch (für Production)
Value: https://helvenda-abc123.vercel.app (für Preview - automatisch)
Value: http://localhost:3000 (für Development)
Umgebungen: ✅ Production, ✅ Preview, ✅ Development
```

---

### 3. `API_DOMAIN` - Separate API-Domain (Optional, für Zukunft)

**Zweck:**
- Definiert eine separate API-Domain (z.B. `api.helvenda.ch`)
- Nur nötig wenn separate API-Domain geplant ist
- Aktuell **NICHT empfohlen** für Helvenda

**Verwendung:**
```typescript
import { getApiDomain } from '@/lib/env'

// Falls API_DOMAIN gesetzt ist:
const apiUrl = getApiDomain(request) // → "https://api.helvenda.ch"

// Ansonsten:
const apiUrl = getApiDomain(request) // → "https://www.helvenda.ch" (gleiche Domain)
```

**Vercel Setup:**
```
Key: API_DOMAIN
Value: https://api.helvenda.ch (nur wenn separate API-Domain geplant)
Umgebungen: ✅ Production, ✅ Preview, ✅ Development
```

---

## 🔄 Migration von alten Variablen

### Vorher (alt):
```typescript
// Debug-Check
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info')
}

// Domain-Check
const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000'
```

### Nachher (neu):
```typescript
import { isDebug, getAppDomain } from '@/lib/env'

// Debug-Check
if (isDebug()) {
  console.log('Debug info')
}

// Domain-Check
const baseUrl = getAppDomain(request)
```

---

## 📝 Vercel Setup - Schritt für Schritt

### 1. Gehe zu Vercel Dashboard
1. Öffne: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Wähle Projekt: **helvenda**
3. Gehe zu: **Settings → Environment Variables**

### 2. Füge `DEBUG` hinzu
1. Klicke auf **"Add New"**
2. **Key:** `DEBUG`
3. **Value:** 
   - Production: `false`
   - Preview: `true`
   - Development: `true`
4. Wähle Umgebungen: ✅ Production, ✅ Preview, ✅ Development
5. Klicke auf **"Save"**

### 3. Füge `APP_DOMAIN` hinzu
1. Klicke auf **"Add New"**
2. **Key:** `APP_DOMAIN`
3. **Value:**
   - Production: `https://www.helvenda.ch`
   - Preview: (leer lassen - verwendet automatisch VERCEL_URL)
   - Development: `http://localhost:3000`
4. Wähle Umgebungen: ✅ Production, ✅ Preview, ✅ Development
5. Klicke auf **"Save"**

### 4. Deployment neu starten
Nach dem Hinzufügen der Variablen:
1. Gehe zu **Deployments**
2. Klicke auf **"Redeploy"** für das neueste Deployment
3. Oder pushe einen neuen Commit

---

## 🎯 Vorteile

### `DEBUG` Variable:
- ✅ Debugging in Production möglich (temporär `DEBUG=true` setzen)
- ✅ Flexibler als `NODE_ENV` (unabhängig von Build-Umgebung)
- ✅ Preview-Deployments können Debug-Logs haben
- ✅ Einfaches Toggle ohne Code-Änderung

### `APP_DOMAIN` Variable:
- ✅ Klare Domain-Konfiguration ohne komplexe Fallbacks
- ✅ E-Mail-Links zeigen immer die richtige Domain
- ✅ Stripe Redirects funktionieren korrekt
- ✅ Einfacher zu verstehen und zu warten

---

## 🔍 Verwendung im Code

### Zentrale Utilities (`src/lib/env.ts`):
```typescript
// Debug-Funktionen
isDebug()                    // Prüft ob Debug aktiv ist
shouldShowDetailedErrors()   // Prüft ob detaillierte Fehler angezeigt werden
shouldLogStackTraces()       // Prüft ob Stack-Traces geloggt werden

// Domain-Funktionen
getAppDomain(request?)       // Gibt App-Domain zurück
getApiDomain(request?)       // Gibt API-Domain zurück (falls gesetzt)
```

### Beispiel-Verwendung:
```typescript
// In API Routes:
import { isDebug, getAppDomain, shouldShowDetailedErrors } from '@/lib/env'

export async function GET(request: NextRequest) {
  // Debug-Logging
  if (isDebug()) {
    console.log('Request details:', request.url)
  }

  // Domain für Links
  const baseUrl = getAppDomain(request)
  const emailLink = `${baseUrl}/verify-email?token=abc123`

  // Fehler-Response
  if (error) {
    return NextResponse.json({
      message: 'Error occurred',
      ...(shouldShowDetailedErrors() && {
        error: error.message,
        stack: error.stack,
      }),
    })
  }
}
```

---

## ✅ Checkliste

- [ ] `DEBUG` Variable in Vercel hinzugefügt
- [ ] `APP_DOMAIN` Variable in Vercel hinzugefügt
- [ ] Deployment neu gestartet
- [ ] Getestet: Debug-Logs erscheinen in Preview
- [ ] Getestet: E-Mail-Links zeigen richtige Domain
- [ ] Getestet: Stripe Redirects funktionieren

---

## 📚 Weitere Informationen

- **Code-Integration:** Siehe `src/lib/env.ts` für alle Utility-Funktionen
- **Error-Handling:** Siehe `src/lib/error-handling.ts` für Debug-Integration
- **Beispiele:** Siehe `src/app/api/stripe/connect/account-link/route.ts` für Domain-Verwendung
