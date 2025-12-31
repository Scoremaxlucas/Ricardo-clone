/**
 * Environment Variables Utilities
 *
 * Zentrale Funktionen für den Zugriff auf Environment-Variablen
 * mit sinnvollen Fallbacks und Type-Safety
 */

/**
 * Prüft ob Debug-Modus aktiviert ist
 *
 * Debug ist aktiv wenn:
 * - DEBUG=true explizit gesetzt ist, ODER
 * - NODE_ENV=development ist
 *
 * @returns true wenn Debug-Modus aktiv ist
 */
export function isDebug(): boolean {
  return process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development'
}

/**
 * Gibt die App-Domain zurück mit sinnvollen Fallbacks
 *
 * Priorität:
 * 1. APP_DOMAIN (explizit gesetzt)
 * 2. NEXT_PUBLIC_APP_URL (für Client-Side)
 * 3. NEXT_PUBLIC_BASE_URL (Fallback)
 * 4. NEXTAUTH_URL (NextAuth Fallback)
 * 5. VERCEL_URL (Vercel Preview URLs)
 * 6. Request URL (aus Request-Header)
 * 7. localhost:3000 (Development Fallback)
 *
 * @param request Optional: NextRequest für Fallback auf Request-URL
 * @returns Die App-Domain (z.B. "https://www.helvenda.ch")
 */
export function getAppDomain(request?: { url?: string }): string {
  // 1. Explizite APP_DOMAIN hat höchste Priorität
  if (process.env.APP_DOMAIN) {
    return process.env.APP_DOMAIN
  }

  // 2. NEXT_PUBLIC_APP_URL (für Client-Side)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }

  // 3. NEXT_PUBLIC_BASE_URL (Fallback)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }

  // 4. NEXTAUTH_URL (NextAuth Fallback)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }

  // 5. VERCEL_URL (Vercel Preview URLs)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 6. Request URL (aus Request-Header)
  if (request?.url) {
    try {
      const url = new URL(request.url)
      const baseUrl = `${url.protocol}//${url.host}`
      // Prüfe auf ungültige URLs
      if (baseUrl && !baseUrl.includes('undefined')) {
        return baseUrl
      }
    } catch (e) {
      // Ignore URL parse errors
    }
  }

  // 7. Development Fallback
  return 'http://localhost:3000'
}

/**
 * Gibt die API-Domain zurück
 *
 * Falls API_DOMAIN gesetzt ist, wird diese verwendet.
 * Ansonsten wird getAppDomain() verwendet (API läuft auf derselben Domain).
 *
 * @param request Optional: NextRequest für Fallback
 * @returns Die API-Domain (z.B. "https://api.helvenda.ch" oder "https://www.helvenda.ch")
 */
export function getApiDomain(request?: { url?: string }): string {
  // Falls separate API-Domain konfiguriert ist
  if (process.env.API_DOMAIN) {
    return process.env.API_DOMAIN
  }

  // Ansonsten nutze App-Domain (API läuft auf derselben Domain)
  return getAppDomain(request)
}

/**
 * Prüft ob detaillierte Fehlerinfos angezeigt werden sollen
 *
 * @returns true wenn detaillierte Fehlerinfos angezeigt werden sollen
 */
export function shouldShowDetailedErrors(): boolean {
  return isDebug()
}

/**
 * Prüft ob Stack-Traces geloggt werden sollen
 *
 * @returns true wenn Stack-Traces geloggt werden sollen
 */
export function shouldLogStackTraces(): boolean {
  return isDebug()
}
