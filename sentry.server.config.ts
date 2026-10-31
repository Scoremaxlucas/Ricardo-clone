import * as Sentry from '@sentry/nextjs'

/**
 * Fehler-Monitoring (nur Server). Ohne SENTRY_DSN bleibt Sentry aus.
 *
 * Datenschutz: keine Request-Bodies, Cookies oder IPs — hier laufen Ausweise,
 * Betreibungsauszüge und Lohndaten durch. Gesendet werden Fehler und die
 * SIC-Warnereignisse aus `sicLog`, ohne E-Mail-Adressen.
 */
const dsn = process.env.SENTRY_DSN?.trim()

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data
        delete event.request.cookies
        delete event.request.headers
        delete event.request.query_string
      }
      if (event.user) event.user = { id: event.user.id }
      return event
    },
  })
}
