'use client'

import { sicPaths } from '@/lib/sic/config'
import { useState } from 'react'

/**
 * Bestätigt den Magic-Link per POST und navigiert hart zum Workspace.
 * Reines HTML-form + 307-Redirect wirkte für Nutzer oft wie «keine Reaktion».
 */
export function SicMagicLoginButton({
  token,
  next,
}: {
  token: string
  next: string
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(sicPaths.authCallback, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ token, next }),
      })
      if (res.redirected && res.url) {
        window.location.assign(res.url)
        return
      }
      // fetch folgt Redirects; bei 303 landet man oft bei 200 auf dem Ziel — Location nutzen
      if (res.ok) {
        window.location.assign(next || sicPaths.certificateWorkspace)
        return
      }
      if (res.status === 303 || res.status === 302) {
        const loc = res.headers.get('Location')
        window.location.assign(loc || sicPaths.certificateWorkspace)
        return
      }
      setError('Anmeldung fehlgeschlagen. Bitte fordere einen neuen Link an.')
      setBusy(false)
    } catch {
      setError('Netzwerkfehler. Bitte erneut versuchen.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6">
      <button
        type="submit"
        disabled={busy}
        className="min-h-11 w-full rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60"
      >
        {busy ? 'Wird angemeldet …' : 'Anmelden'}
      </button>
      {error ?
        <p className="mt-3 text-center text-sm text-sic-danger-text">{error}</p>
      : null}
    </form>
  )
}
