'use client'

import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { formatDate } from '@/lib/utils/formatDate'
import { CheckCircle2, Shield } from 'lucide-react'
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
  title: string
  body: string
  href: string
  cta: string
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
        title: 'Profil vervollständigen',
        body: 'Bitte ergänze zuerst dein Mieterprofil — danach wird der Qualitätsnachweis freigeschaltet.',
        href: '/profil/bearbeiten',
        cta: 'Profil bearbeiten',
      }
    case 'CREDIT_CHECK_NOT_APPROVED': {
      if (opts.postProfileOnboarding) {
        if (pending) {
          return {
            tone: 'milestone',
            title: 'Profil vollständig — Auszug wird geprüft',
            body: 'Danke für deine Angaben. Dein Betreibungsregisterauszug ist bei uns eingegangen und wird gerade geprüft. Sobald die Freigabe da ist, kannst du hier deinen Qualitätsnachweis mit einem Klick ausstellen (PDF und Prüf-Link für Bewerbungen auch ausserhalb von Helvenda).',
            href: '/profil/betreibungsregister',
            cta: 'Zum Upload & Status',
          }
        }
        return {
          tone: 'milestone',
          title: 'Profil vollständig — fast geschafft',
          body: 'Danke für deine Angaben. Als Nächstes brauchen wir einen verifizierten Betreibungsregisterauszug. Sobald er freigegeben ist, stellst du deinen Helvenda-Qualitätsnachweis hier mit einem Klick aus — inklusive PDF und Prüf-Link für Vermieter und andere Portale.',
          href: '/profil/betreibungsregister',
          cta: 'Betreibungsregister hochladen',
        }
      }
      if (pending) {
        return {
          tone: 'milestone',
          title: 'Betreibungsregister wird geprüft',
          body: 'Dein Auszug ist eingegangen. Sobald die Prüfung abgeschlossen ist, kannst du den Qualitätsnachweis hier ausstellen. Du wirst per E-Mail informiert.',
          href: '/profil/betreibungsregister',
          cta: 'Upload & Status',
        }
      }
      return {
        tone: 'milestone',
        title: 'Nächster Schritt: Betreibungsregister',
        body: 'Für den Helvenda-Qualitätsnachweis brauchen wir einen verifizierten Betreibungsregisterauszug. Nach dem Upload prüfen wir den Auszug — danach kannst du dein Zertifikat hier ausstellen.',
        href: '/profil/betreibungsregister',
        cta: 'Zum Betreibungsregister',
      }
    }
    case 'CREDIT_CHECK_EXPIRED':
      return {
        tone: 'milestone',
        title: 'Betreibungsregister erneuern',
        body: 'Dein letzter Auszug ist nicht mehr gültig. Bitte lade einen aktuellen Auszug hoch — danach kannst du den Qualitätsnachweis wieder ausstellen.',
        href: '/profil/betreibungsregister',
        cta: 'Neuen Auszug hochladen',
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
      if (!data.reused) {
        toast.success('Zertifikat ausgestellt ✓')
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
      toast.success('Prüf-Link kopiert ✓')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }, [verifyPageUrl])

  const copyCertificateCode = useCallback(async () => {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      toast.success('Code kopiert ✓')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }, [code])

  const validUntil =
    creditCheckExpiresAt ? formatDate(creditCheckExpiresAt) : '—'

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[#f5fdfb] px-5 pb-14 pt-20 sm:pt-24">
      <div className="w-full max-w-md text-center">
        {phase === 'success' && code ?
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f7f2] text-[#107a5a]">
              <CheckCircle2 className="h-12 w-12 animate-helvenda-cert-check" strokeWidth={2} />
            </div>
            <h1 className="mt-8 text-2xl font-extrabold text-[#0d2b1f]">Dein Qualitätsnachweis ist bereit</h1>
            <p className="mt-2 text-sm text-[#5a7a6e]">Zertifikats-Code</p>
            <p className="mt-1 font-mono text-sm font-semibold tracking-[0.18em] text-[#0d2b1f]">{code}</p>
            <div className="mx-auto mt-10 w-full max-w-sm space-y-3">
              <button
                type="button"
                onClick={downloadPdf}
                className="w-full rounded-xl bg-[#18a87c] px-6 py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95"
              >
                PDF herunterladen
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void copyVerifyLink()}
                  className="rounded-xl border-2 border-[#18a87c] bg-white px-3 py-3 text-xs font-bold text-[#107a5a] hover:bg-[#f5fdfb] sm:text-[13px]"
                >
                  Link kopieren
                </button>
                <button
                  type="button"
                  onClick={() => void copyCertificateCode()}
                  className="rounded-xl border-2 border-[#18a87c] bg-white px-3 py-3 text-xs font-bold text-[#107a5a] hover:bg-[#f5fdfb] sm:text-[13px]"
                >
                  Code kopieren
                </button>
              </div>
              {verifyPageUrl ?
                <a
                  href={verifyPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center text-sm font-semibold text-[#107a5a] underline-offset-2 hover:underline"
                >
                  Prüfseite in neuem Tab öffnen
                </a>
              : null}
              <Link href="/profil" className="block pt-1 text-center text-sm font-medium text-slate-500 hover:text-slate-700">
                Zum Profil
              </Link>
            </div>
            <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-[#d4eee4] bg-white px-5 py-5 text-left shadow-sm">
              <p className="text-sm font-bold text-[#0d2b1f]">Für Bewerbungen ausserhalb Helvenda</p>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[#5a7a6e]">
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-[#107a5a]">·</span>
                  <span>
                    <strong className="text-[#0d2b1f]">PDF</strong> anhängen — wie ein klassischer Nachweis.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 font-bold text-[#107a5a]">·</span>
                  <span>
                    <strong className="text-[#0d2b1f]">Link oder Code</strong> in die Mail setzen — Vermieter prüfen
                    den Stand online.
                  </span>
                </li>
              </ul>
              <p className="mt-4 text-xs leading-relaxed text-[#8aa89e]">
                Auf Helvenda bleibt dein Profil mit diesem Nachweis verknüpft; passende Inserate bewirbst du mit einem
                Klick.
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
          <>
            {gate.tone === 'milestone' ?
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f7f2] text-[#18a87c]">
                <CheckCircle2 className="h-11 w-11" strokeWidth={2} aria-hidden />
              </div>
            : <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                <span className="text-2xl font-bold" aria-hidden>
                  !
                </span>
              </div>
            }
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
              <Shield className="h-11 w-11 animate-pulse text-[#18a87c]" strokeWidth={1.75} />
            </div>
            <h1 className="mt-10 text-2xl font-extrabold text-[#0d2b1f]">Dein Helvenda Qualitätsnachweis</h1>
            <p className="mt-4 text-sm leading-relaxed text-[#5a7a6e]">
              Wir stellen dir jetzt deinen persönlichen Qualitätsnachweis aus. Er enthält:
            </p>
            <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm font-medium text-[#0d2b1f]">
              <li className="flex gap-2">
                <span className="text-[#107a5a]">✓</span> Verifiziertes Betreibungsregister
              </li>
              <li className="flex gap-2">
                <span className="text-[#107a5a]">✓</span> Einkommenskategorie
              </li>
              <li className="flex gap-2">
                <span className="text-[#107a5a]">✓</span> Beschäftigungsstatus
              </li>
              <li className="flex gap-2">
                <span className="text-[#107a5a]">✓</span> Einzigartiger Verifikations-Code
              </li>
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
