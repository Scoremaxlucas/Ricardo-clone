'use client'

import { SicLogoMark } from '@/components/sic/SicLogo'
import { SIC_CERT_TAGLINE, SIC_COLORS, SIC_TAGLINE } from '@/lib/sic/brand'
import { SIC_REVIEW_SLA_SENTENCE, sicPaths } from '@/lib/sic/config'
import { HouseMark } from '@/lib/sic/cert/art-web'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const DEFAULT_INTRO =
  'Stand, Formulare und Nachweise zu deinem geprüften Mieter-Zertifikat — mit einem Anmeldelink an deine E-Mail, ohne Passwort.'

const DEFAULT_LINK_HINT =
  'Der Link ist 30 Minuten gültig und einmal verwendbar. Den Vorgang kannst du über Tage fortsetzen; einen neuen Link forderst du jederzeit an.'

const INPUT_CLASS =
  'mt-1.5 w-full rounded-xl border border-sic-hairline bg-sic-paper px-4 py-3 text-base outline-none ring-sic-action/20 focus:border-sic-action focus:ring-2'

function MiniCertificatePreview() {
  return (
    <aside
      aria-hidden
      className="mb-8 overflow-hidden border border-sic-navy bg-sic-paper shadow-[0_18px_40px_-28px_rgba(15,43,94,0.45)]"
    >
      <div className="relative flex flex-col items-center bg-sic-navy px-4 pb-3.5 pt-4">
        <p className="absolute right-3 top-2 font-mono text-[9px] font-semibold tracking-[0.12em] text-sic-gold-light/90">
          SIC-2026-BEISPIEL
        </p>
        <HouseMark size={28} onDark />
        <p className="mt-1 text-xs font-bold tracking-tight text-white">
          Swiss <span style={{ color: SIC_COLORS.red }}>Immo</span> Cert
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-px w-5 bg-sic-gold" />
          <span className="text-[8px] font-semibold tracking-[0.22em] text-sic-gold-light">
            MIETER-ZERTIFIKAT
          </span>
          <span className="h-px w-5 bg-sic-gold" />
        </div>
        <p className="mt-1 text-[9px] tracking-wide text-[#e8d5a3]">{SIC_CERT_TAGLINE}</p>
      </div>
      <div className="px-4 py-3">
        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-sic-navy">
          4 von 4 Angaben geprüft
        </p>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-500">
          Geprüft · standardisiert · per QR nachvollziehbar
        </p>
      </div>
    </aside>
  )
}

export function SicDossierLogin({
  nextPath,
  title = 'Mein Zertifikat',
  intro = DEFAULT_INTRO,
  linkHint = DEFAULT_LINK_HINT,
  showReviewSla = true,
  showBrandCue = true,
  showCertPreview = true,
}: {
  nextPath?: string
  title?: string
  intro?: string
  /** Mechanik des Anmeldelinks — unter dem Nutzen, kleiner gesetzt. */
  linkHint?: string | null
  /** Prüfung-Dauer — auf dem Zertifikat-Gate sichtbar, bei Verlängerung aus. */
  showReviewSla?: boolean
  /** Kleines Markensignal über dem Titel — auf Verlängerung reduziert. */
  showBrandCue?: boolean
  /** Mini-Urkunde wie auf der Landing — nur auf dem Zertifikat-Gate. */
  showCertPreview?: boolean
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
    <div className="relative mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-5 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-5 top-10 bottom-10 -z-10 rounded-[2rem] bg-gradient-to-b from-sic-navy/[0.04] via-sic-paper-soft/80 to-transparent"
      />
      <div className="relative">
        {showBrandCue ?
          <div className="mb-5 flex items-center gap-3">
            <SicLogoMark size={36} />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sic-navy/55">
                Swiss Immo Cert
              </p>
              <p className="truncate text-xs text-slate-500">{SIC_TAGLINE}</p>
            </div>
          </div>
        : null}
        <div className="mb-5 h-px w-16 bg-sic-gold/70" aria-hidden />

        {showCertPreview && !sent ? <MiniCertificatePreview /> : null}

        <h1 className="font-sic-serif text-2xl font-bold tracking-tight text-sic-navy sm:text-3xl">{title}</h1>
        <p className="mt-2 text-base leading-relaxed text-slate-600">{intro}</p>
        {showReviewSla ?
          <p className="mt-2 text-sm leading-relaxed text-sic-navy/80">
            Eingereichte Unterlagen: {SIC_REVIEW_SLA_SENTENCE}
          </p>
        : null}
        {linkHint && !sent ?
          <p className="mt-2 text-xs leading-relaxed text-slate-400">{linkHint}</p>
        : null}

        {sent ?
          <div className="mt-6 border border-sic-navy/10 bg-white/70 p-5 text-sm text-sic-navy">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-sic-action" />
              <div>
                <p className="font-semibold">Prüfe dein Postfach</p>
                <p className="mt-1.5 leading-relaxed text-slate-600">
                  Falls zu <span className="font-medium text-sic-navy">{email.trim()}</span> ein Zertifikat
                  existiert, ist der Anmeldelink unterwegs — oft innerhalb einer Minute. Schau auch im
                  Spam-Ordner nach.
                </p>
                <ol className="mt-3 list-decimal space-y-1.5 pl-4 text-slate-600">
                  <li>Mail von Swiss Immo Cert öffnen</li>
                  <li>Link antippen</li>
                  <li>Auf der Seite «Anmelden» bestätigen</li>
                </ol>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 text-sm font-semibold text-sic-action hover:underline"
                >
                  Anderen Link anfordern
                </button>
              </div>
            </div>
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
              className={INPUT_CLASS}
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
    </div>
  )
}
