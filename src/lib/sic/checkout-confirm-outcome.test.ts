import { sicConfirmOutcome } from '@/lib/sic/checkout-confirm-outcome'
import { describe, expect, it } from 'vitest'

describe('sicConfirmOutcome', () => {
  it('bestätigt und wartet wie bisher', () => {
    expect(sicConfirmOutcome(200, { ok: true })).toEqual({ status: 'ok' })
    expect(sicConfirmOutcome(200, { ok: false, pending: true })).toEqual({ status: 'pending' })
  })

  it('versucht es bei einem kurzen Aussetzer weiter statt einen Fehler zu zeigen', () => {
    // Anfrage kam nicht an (Netz weg).
    expect(sicConfirmOutcome(null, null)).toEqual({ status: 'retry' })
    // Datenbank kurz nicht erreichbar: die Route antwortet 502 «Fehler bei der Bestätigung.»
    expect(sicConfirmOutcome(502, { ok: false, message: 'Fehler bei der Bestätigung.' })).toEqual({
      status: 'retry',
    })
    expect(sicConfirmOutcome(500, { ok: false, message: 'Verarbeitung fehlgeschlagen.' })).toEqual({
      status: 'retry',
    })
    // Antwort ohne lesbaren Inhalt (Gateway-Fehlerseite).
    expect(sicConfirmOutcome(504, null)).toEqual({ status: 'retry' })
    expect(sicConfirmOutcome(429, null)).toEqual({ status: 'retry' })
  })

  it('zeigt einen echten Fehler nur bei einer endgültigen Absage', () => {
    expect(sicConfirmOutcome(400, { ok: false, message: 'session_id fehlt.' })).toEqual({
      status: 'error',
      message: 'session_id fehlt.',
    })
    expect(sicConfirmOutcome(404, null)).toEqual({ status: 'error', message: undefined })
  })
})
