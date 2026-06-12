'use client'

import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { formatDate } from '@/lib/utils/formatDate'
import { dispatchWohnenNavRefresh } from '@/lib/wohnen-nav-refresh'
import { Check, CheckCircle2, Shield } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

type Props = {
  creditCheckExpiresAt: string | null
  creditCheckStatus: string
  eligible: boolean
  eligibilityReason?: string
  initialCertificateCode: string | null
  /** Direkt nach abgeschlossenem Profil-Onboarding: wärmere Brücke zum Betreibungsregister-Schritt. */
  postProfileOnboarding?: boolean
}

type IssueResponse =
  | { success: true; certificate: { certificateCode: string }; reused?: boolean }
  | { message?: string; reason?: string }

export type ZertifikatGateMessage = {
  tone: 'milestone' | 'error'
  eyebrow?: string
  title: string
  acknowledgment?: string
  body: string
  href: string
  cta: string
  footnote?: string
}

function creditPending(status: string): boolean {
  return status === 'PENDING' || status === 'PENDING_MANUAL_REVIEW'
}

function gateMessageFromEligibility(
  reason: string | undefined,
  opts: { postProfileOnboarding?: boolean; creditCheckStatus?: string }
): ZertifikatGateMessage {
  const status = opts.creditCheckStatus ?? ''
  const pending = creditPending(status)

  switch (reason) {
    case 'PROFILE_INCOMPLETE':
      return {
        tone: 'milestone',
        eyebrow: 'Helvenda Qualitätsnachweis',
        title: 'Profil vervollständigen',
        body: 'Bitte ergänze zuerst dein Mieterprofil — danach wird der Qualitätsnachweis freigeschaltet.',
        href: '/profil/bearbeiten',
        cta: 'Profil bearbeiten',
        footnote: 'Ein vollständiges Profil ist die Basis für alle verifizierten Bewerbungen auf Helvenda.',
      }
    case 'CREDIT_CHECK_NOT_APPROVED': {
      if (opts.postProfileOnboarding) {
        if (pending) {
          return {
            tone: 'milestone',
            eyebrow: 'Helvenda Qualitätsnachweis',
            title: 'Auszug wird geprüft',
            acknowledgment: 'Danke — dein Profil ist vollständig und gespeichert.',
            body: 'Dein Betreibungsregisterauszug ist eingegangen und wird gerade von uns geprüft. Sobald die Freigabe da ist, stellst du hier deinen Qualitätsnachweis mit einem Klick aus: PDF und öffentlicher Prüf-Link, einsetzbar auch bei anderen Portalen und direkt beim Vermieter.',
            href: '/profil/betreibungsregister',
            cta: 'Upload & Status anzeigen',
            footnote: 'Du erhältst eine E-Mail, sobald die Prüfung abgeschlossen ist.',
          }
        }
        return {
          tone: 'milestone',
          eyebrow: 'Helvenda Qualitätsnachweis',
          title: 'Profil vollständig — ein Schritt zum Nachweis',
          acknowledgment: 'Danke. Wir haben deine Angaben sicher übernommen; das Mieterprofil ist vollständig.',
          body: 'Als Nächstes laden wir gemeinsam deinen Betreibungsregisterauszug hoch. Nach der Freigabe durch Helvenda stellst du hier deinen Qualitätsnachweis mit einem Klick aus — inklusive PDF und Prüf-Link für Vermieter und andere Portale.',
          href: '/profil/betreibungsregister',
          cta: 'Jetzt Betreibungsregister hochladen',
          footnote:
            'In der Regel nur wenige Minuten. Deine Unterlagen werden vertraulich und ausschliesslich für die Verifizierung genutzt.',
        }
      }
      if (pending) {
        return {
          tone: 'milestone',
          eyebrow: 'Helvenda Qualitätsnachweis',
          title: 'Betreibungsregister wird geprüft',
          body: 'Dein Auszug ist eingegangen. Sobald die Prüfung abgeschlossen ist, kannst du den Qualitätsnachweis hier ausstellen. Du wirst per E-Mail informiert.',
          href: '/profil/betreibungsregister',
          cta: 'Upload & Status',
          footnote: 'Prüfung in der Regel innerhalb eines Werktags.',
        }
      }
      return {
        tone: 'milestone',
        eyebrow: 'Helvenda Qualitätsnachweis',
        title: 'Nächster Schritt: Betreibungsregister',
        body: 'Für den Helvenda-Qualitätsnachweis brauchen wir einen verifizierten Betreibungsregisterauszug. Nach dem Upload prüfen wir den Auszug — danach kannst du dein Zertifikat hier ausstellen.',
        href: '/profil/betreibungsregister',
        cta: 'Zum Betreibungsregister',
        footnote: 'Der Nachweis bleibt gültig, solange dein Auszug gültig ist — und funktioniert auch ausserhalb von Helvenda.',
      }
    }
    case 'CREDIT_CHECK_EXPIRED':
      return {
        tone: 'milestone',
        eyebrow: 'Helvenda Qualitätsnachweis',
        title: 'Betreibungsregister erneuern',
        body: 'Dein letzter Auszug ist nicht mehr gültig. Bitte lade einen aktuellen Auszug hoch — danach kannst du den Qualitätsnachweis wieder ausstellen.',
        href: '/profil/betreibungsregister',
        cta: 'Neuen Auszug hochladen',
        footnote: 'So bleibt dein Nachweis für Vermieter und Portale nachvollziehbar aktuell.',
      }
    case 'HOUSING_INCOMPLETE':
      return {
        tone: 'milestone',
        eyebrow: 'Helvenda Qualitätsnachweis',
        title: 'Wohnverhältnis ergänzen',
        body: 'Bitte ergänze in deinem Profil, ob du zur Miete, im Eigentum oder in einem anderen Wohnverhältnis wohnst — und seit wann du an deiner aktuellen Adresse wohnhaft bist. Diese Angaben erscheinen auf deinem Qualitätsnachweis.',
        href: '/profil/bearbeiten',
        cta: 'Profil bearbeiten',
        footnote: 'Selbstangabe für Vermieter — wie Beschäftigung und Einkommenskategorie.',
      }
    default:
      return {
        tone: 'error',
        title: 'Ausstellung nicht möglich',
        body: 'Bitte versuche es später erneut oder kontaktiere den Support.',
        href: '/profil',
        cta: 'Zum Profil',
      }
  }
}

function issueErrorToGate(reason?: string): ZertifikatGateMessage {
  return gateMessageFromEligibility(reason, {})
}

export function ZertifikatClient({
  creditCheckExpiresAt,
  creditCheckStatus,
  eligible,
  eligibilityReason,
  initialCertificateCode,
  postProfileOnboarding = false,
}: Props) {
  const [phase, setPhase] = useState<'ready' | 'loading' | 'success' | 'error'>(
    initialCertificateCode ? 'success' : eligible ? 'ready' : 'error'
  )
  const [code, setCode] = useState<string | null>(initialCertificateCode)
  const [gate, setGate] = useState<ZertifikatGateMessage | null>(
    eligible ?
      null
    : gateMessageFromEligibility(eligibilityReason, { postProfileOnboarding, creditCheckStatus })
  )

  const issue = useCallback(async () => {
    setPhase('loading')
    setGate(null)
    try {
      const res = await fetch('/api/certificate/issue', { method: 'POST', credentials: 'same-origin' })
      const data = (await res.json().catch(() => ({}))) as IssueResponse
      if (!res.ok || !('success' in data) || !data.success) {
        const r = 'reason' in data ? data.reason : undefined
        setGate(issueErrorToGate(r))
        setPhase('error')
        return
      }
      setCode(data.certificate.certificateCode)
      setPhase('success')
      dispatchWohnenNavRefresh()
      if (!data.reused) {
        toast.success('Zertifikat ausgestellt')
      }
    } catch {
      setGate(issueErrorToGate())
      setPhase('error')
    }
  }, [])

  const verifyPageUrl = code ? `${WOHNEN_SITE_ORIGIN.replace(/\/$/, '')}/verify/${encodeURIComponent(code)}` : ''

  const downloadPdf = useCallback(() => {
    if (!code) return
    window.open(
      `/api/certificate/${encodeURIComponent(code)}/pdf?t=${Date.now()}`,
      '_blank',
      'noopener,noreferrer'
    )
  }, [code])

  const copyVerifyLink = useCallback(async () => {
    if (!verifyPageUrl) return
    try {
      await navigator.clipboard.writeText(verifyPageUrl)
      toast.success('Prüf-Link kopiert')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }, [verifyPageUrl])

  const validUntil =
    creditCheckExpiresAt ? formatDate(creditCheckExpiresAt) : '—'

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[#f5fdfb] px-5 pb-14 pt-20 sm:pt-24">
      <div className="w-full max-w-xl text-center">
        {phase === 'success' && code ?
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f7f2] text-[#107a5a]">
              <CheckCircle2 className="h-12 w-12 animate-helvenda-cert-check" strokeWidth={2} />
            </div>
            <h1 className="mt-8 text-2xl font-extrabold text-[#0d2b1f]">Dein Helvenda-Zertifikat ist bereit</h1>
            <p className="mt-2 text-sm text-[#5a7a6e]">Zertifikats-Code</p>
            <p className="mt-1 select-all font-mono text-sm font-semibold tracking-[0.18em] text-[#0d2b1f]">{code}</p>
            <div className="mx-auto mt-10 w-full max-w-sm space-y-3">
              <button
                type="button"
                onClick={downloadPdf}
                className="w-full rounded-xl bg-[#18a87c] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95"
              >
                PDF herunterladen
              </button>
              <button
                type="button"
                onClick={() => void copyVerifyLink()}
                className="w-full rounded-xl border-2 border-[#18a87c] bg-white px-6 py-3 text-sm font-bold text-[#107a5a] hover:bg-[#f5fdfb]"
              >
                Prüf-Link kopieren
              </button>
              {verifyPageUrl ?
                <a
                  href={verifyPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block pt-1 text-center text-sm font-medium text-[#5a7a6e] underline-offset-2 hover:text-[#107a5a] hover:underline"
                >
                  Prüfseite ansehen
                </a>
              : null}
            </div>
            <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-[#d4eee4] bg-white px-5 py-5 text-left shadow-sm">
              <p className="text-sm font-bold text-[#0d2b1f]">So nutzt du es</p>
              <p className="mt-3 text-sm leading-relaxed text-[#5a7a6e]">
                Hänge das <strong className="text-[#0d2b1f]">PDF</strong> an deine Bewerbung an — oder teile den{' '}
                <strong className="text-[#0d2b1f]">Prüf-Link</strong> per E-Mail. Vermieter sehen deinen verifizierten
                Stand online. Der Code oben kannst du bei Bedarf manuell mitgeben.
              </p>
            </div>
          </>
        : phase === 'loading' ?
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f7f2]">
              <Shield className="h-11 w-11 animate-pulse text-[#18a87c]" strokeWidth={1.75} />
            </div>
            <p className="mt-10 text-base font-semibold text-[#0d2b1f]">Zertifikat wird ausgestellt…</p>
          </>
        : phase === 'error' && gate ?
          gate.tone === 'milestone' ?
            <div className="mx-auto w-full max-w-lg rounded-2xl border border-[#bfe8d4] bg-white px-7 py-10 shadow-[0_24px_64px_-28px_rgba(13,43,31,0.18)] sm:px-10 sm:py-12">
              {gate.eyebrow ?
                <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-[#18a87c]">
                  {gate.eyebrow}
                </p>
              : null}
              <div className="mx-auto mt-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-[#e8f7f2] text-[#18a87c] ring-1 ring-[#18a87c]/20">
                <CheckCircle2 className="h-11 w-11" strokeWidth={2} aria-hidden />
              </div>
              <h1 className="mt-7 text-[1.35rem] font-extrabold leading-tight tracking-[-0.02em] text-[#0d2b1f] sm:text-[1.65rem]">
                {gate.title}
              </h1>
              {gate.acknowledgment ?
                <p className="mx-auto mt-5 max-w-md text-[1.0625rem] font-semibold leading-snug text-[#0d2b1f]">
                  {gate.acknowledgment}
                </p>
              : null}
              <p
                className={`mx-auto max-w-md text-sm leading-relaxed text-[#5a7a6e] sm:text-[15px] ${gate.acknowledgment ? 'mt-4' : 'mt-5'}`}
              >
                {gate.body}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href={gate.href}
                  className="inline-flex min-h-[52px] min-w-[min(100%,16rem)] items-center justify-center rounded-xl bg-[#18a87c] px-8 py-3.5 text-[15px] font-bold text-white shadow-md transition hover:opacity-95"
                >
                  {gate.cta}
                </Link>
                {eligible ?
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('ready')
                      setGate(null)
                    }}
                    className="inline-flex items-center justify-center rounded-xl border-2 border-[#18a87c] px-6 py-3 text-sm font-bold text-[#107a5a] hover:bg-[#f5fdfb]"
                  >
                    Erneut versuchen
                  </button>
                : null}
              </div>
              {gate.footnote ?
                <p className="mx-auto mt-8 max-w-md border-t border-slate-100 pt-6 text-center text-xs leading-relaxed text-[#8aa89e]">
                  {gate.footnote}
                </p>
              : null}
            </div>
          : <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                <span className="text-2xl font-bold" aria-hidden>
                  !
                </span>
              </div>
              <h1 className="mt-8 text-xl font-extrabold text-[#0d2b1f] sm:text-2xl">{gate.title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-[#5a7a6e]">{gate.body}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href={gate.href}
                  className="inline-flex items-center justify-center rounded-xl bg-[#18a87c] px-6 py-3 text-sm font-bold text-white shadow-md hover:opacity-95"
                >
                  {gate.cta}
                </Link>
                {eligible ?
                  <button
                    type="button"
                    onClick={() => {
                      setPhase('ready')
                      setGate(null)
                    }}
                    className="inline-flex items-center justify-center rounded-xl border-2 border-[#18a87c] px-6 py-3 text-sm font-bold text-[#107a5a] hover:bg-white/80"
                  >
                    Erneut versuchen
                  </button>
                : null}
              </div>
            </>
        : (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f7f2]">
              <Shield className="h-11 w-11 text-[#18a87c]" strokeWidth={1.75} aria-hidden />
            </div>
            <h1 className="mt-10 text-2xl font-extrabold text-[#0d2b1f]">Dein Helvenda Qualitätsnachweis</h1>
            <p className="mt-4 text-sm leading-relaxed text-[#5a7a6e]">
              Wir stellen dir jetzt deinen persönlichen Qualitätsnachweis aus. Er enthält:
            </p>
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm font-medium text-[#0d2b1f]">
              {[
                'Verifiziertes Betreibungsregister',
                'Einkommenskategorie',
                'Beschäftigungsstatus',
                'Einzigartiger Verifikations-Code',
              ].map(label => (
                <li key={label} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#107a5a]" strokeWidth={2.5} aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm font-semibold text-[#107a5a]">Gültig bis: {validUntil}</p>
            <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-[#d4eee4] bg-white px-5 py-4 text-left text-sm leading-relaxed text-[#5a7a6e] shadow-sm">
              <p className="font-bold text-[#0d2b1f]">Auch für Bewerbungen ausserhalb Helvenda</p>
              <p className="mt-2">
                Nach der Ausstellung erhältst du ein PDF und einen öffentlichen Prüf-Link. Beides kannst du bei
                Portalen, per E-Mail oder direkt beim Vermieter einreichen — derselbe Nachweis gilt auf Helvenda
                weiterhin automatisch.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void issue()}
              className="mt-8 w-full max-w-xs rounded-xl bg-[#18a87c] px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:opacity-95 sm:w-auto"
            >
              Zertifikat ausstellen
            </button>
          </>
        )}
      </div>
    </div>
  )
}
