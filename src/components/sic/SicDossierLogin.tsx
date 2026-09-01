'use client'

import { sicPaths } from '@/lib/sic/config'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SicDossierLogin({
  nextPath,
  title = 'Mein Zertifikat',
  intro = 'Hier siehst du Stand, Formulare und Nachweise. Der Anmeldelink ist 30 Minuten gültig; den Vorgang kannst du über Tage fortsetzen. Fordere jederzeit einen neuen Link an.',
}: {
  nextPath?: string
  title?: string
  intro?: string
}) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function request() {
    if (!EMAIL_RE.test(email.trim())) {
      toast.error('Bitte eine gültige E-Mail-Adresse angeben.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/sic/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), next: nextPath }),
      })
      if (res.ok) setSent(true)
      else toast.error('Bitte später erneut versuchen.')
    } catch {
      toast.error('Netzwerkfehler.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-5 py-16">
      <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">{title}</h1>
      <p className="mt-2 text-slate-600">{intro}</p>

      {sent ?
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-sic-navy/5 p-5 text-sm text-sic-navy">
          <MailCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p>
            Falls zu dieser Adresse ein Zertifikat existiert, haben wir dir einen Anmeldelink gesendet.
            Bitte prüfe dein Postfach (auch den Spam-Ordner).
          </p>
        </div>
      : <div className="mt-6">
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700">
            E-Mail-Adresse
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@beispiel.ch"
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-sic-hairline bg-sic-paper px-4 py-3 text-base outline-none ring-sic-action/20 focus:border-sic-action focus:ring-2"
          />
          <button
            type="button"
            onClick={request}
            disabled={busy}
            className="mt-4 min-h-11 w-full rounded-xl bg-sic-action px-5 py-3.5 text-sm font-semibold text-white hover:bg-sic-action-deep disabled:opacity-60"
          >
            {busy ? 'Wird gesendet …' : 'Anmeldelink senden'}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            Noch nichts angelegt?{' '}
            <a href={sicPaths.landing} className="touch-target-exempt font-semibold text-sic-navy hover:underline">
              Zertifikat anlegen
            </a>
          </p>
        </div>
      }
    </div>
  )
}
