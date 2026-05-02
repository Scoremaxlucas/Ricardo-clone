'use client'

import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { formatDate } from '@/lib/utils/formatDate'
import { CheckCircle2, Shield } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

type Props = {
  creditCheckExpiresAt: string | null
  eligible: boolean
  eligibilityReason?: string
  initialCertificateCode: string | null
}

type IssueResponse =
  | { success: true; certificate: { certificateCode: string }; reused?: boolean }
  | { message?: string; reason?: string }

function issueErrorDe(reason?: string): { title: string; body: string; href: string; cta: string } {
  switch (reason) {
    case 'PROFILE_INCOMPLETE':
      return {
        title: 'Profil unvollständig',
        body: 'Vervollständige bitte zuerst dein Mieterprofil.',
        href: '/profil/bearbeiten',
        cta: 'Profil bearbeiten',
      }
    case 'CREDIT_CHECK_NOT_APPROVED':
      return {
        title: 'Betreibungsregister fehlt oder wird geprüft',
        body: 'Ein verifizierter Betreibungsregisterauszug ist Voraussetzung für den Qualitätsnachweis.',
        href: '/profil/betreibungsregister',
        cta: 'Zum Betreibungsregister',
      }
    case 'CREDIT_CHECK_EXPIRED':
      return {
        title: 'Betreibungsregister abgelaufen',
        body: 'Bitte lade einen neuen Auszug hoch, damit wir dein Zertifikat ausstellen können.',
        href: '/profil/betreibungsregister',
        cta: 'Auszug erneuern',
      }
    default:
      return {
        title: 'Ausstellung nicht möglich',
        body: 'Bitte versuche es später erneut oder kontaktiere den Support.',
        href: '/profil',
        cta: 'Zum Profil',
      }
  }
}

export function ZertifikatClient({
  creditCheckExpiresAt,
  eligible,
  eligibilityReason,
  initialCertificateCode,
}: Props) {
  const [phase, setPhase] = useState<'ready' | 'loading' | 'success' | 'error'>(
    initialCertificateCode ? 'success' : eligible ? 'ready' : 'error'
  )
  const [code, setCode] = useState<string | null>(initialCertificateCode)
  const [error, setError] = useState<{ title: string; body: string; href: string; cta: string } | null>(
    eligible ? null : issueErrorDe(eligibilityReason)
  )

  const issue = useCallback(async () => {
    setPhase('loading')
    setError(null)
    try {
      const res = await fetch('/api/certificate/issue', { method: 'POST', credentials: 'same-origin' })
      const data = (await res.json().catch(() => ({}))) as IssueResponse
      if (!res.ok || !('success' in data) || !data.success) {
        const r = 'reason' in data ? data.reason : undefined
        setError(issueErrorDe(r))
        setPhase('error')
        return
      }
      setCode(data.certificate.certificateCode)
      setPhase('success')
      if (!data.reused) {
        toast.success('Zertifikat ausgestellt ✓')
      }
    } catch {
      setError(issueErrorDe())
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
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-[#f5fdfb] px-5 py-12">
      <div className="w-full max-w-md text-center">
        {phase === 'success' && code ?
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f7f2] text-[#107a5a]">
              <CheckCircle2 className="h-12 w-12 animate-helvenda-cert-check" strokeWidth={2} />
            </div>
            <h1 className="mt-8 text-2xl font-extrabold text-[#0d2b1f]">Zertifikat ausgestellt ✓</h1>
            <p className="mt-3 font-mono text-sm font-semibold tracking-[0.2em] text-[#8aa89e]">{code}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
              <button
                type="button"
                onClick={downloadPdf}
                className="rounded-xl bg-[#18a87c] px-6 py-3 text-sm font-bold text-white shadow-md hover:opacity-95"
              >
                PDF herunterladen
              </button>
              <button
                type="button"
                onClick={() => void copyVerifyLink()}
                className="rounded-xl border-2 border-[#18a87c] bg-white px-6 py-3 text-sm font-bold text-[#107a5a] hover:bg-[#f5fdfb]"
              >
                Prüf-Link kopieren
              </button>
              <button
                type="button"
                onClick={() => void copyCertificateCode()}
                className="rounded-xl border-2 border-[#18a87c] bg-white px-6 py-3 text-sm font-bold text-[#107a5a] hover:bg-[#f5fdfb]"
              >
                Code kopieren
              </button>
              <Link
                href="/profil"
                className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Zum Profil
              </Link>
            </div>
            <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-[#d4eee4] bg-white px-5 py-5 text-left shadow-sm">
              <p className="text-sm font-bold text-[#0d2b1f]">So nutzt du den Nachweis ausserhalb von Helvenda</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#5a7a6e]">
                <li className="flex gap-2">
                  <span className="shrink-0 text-[#107a5a]">1.</span>
                  <span>
                    <strong className="text-[#0d2b1f]">PDF</strong> der Bewerbung beilegen — wie einen klassischen
                    Bewerbungsnachweis.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-[#107a5a]">2.</span>
                  <span>
                    <strong className="text-[#0d2b1f]">Prüf-Link</strong> in die E-Mail oder Signatur setzen, damit
                    Vermieter den Stand selbst prüfen können.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 text-[#107a5a]">3.</span>
                  <span>
                    Auf Helvenda bewirbst du dich danach mit einem Klick auf passende Inserate — Profil und Nachweis
                    sind bereits verbunden.
                  </span>
                </li>
              </ul>
              {verifyPageUrl ?
                <p className="mt-4 break-all text-left text-xs text-[#8aa89e]">
                  Öffentliche Prüfseite:{' '}
                  <a href={verifyPageUrl} className="font-mono font-semibold text-[#107a5a] underline" target="_blank" rel="noreferrer">
                    {verifyPageUrl}
                  </a>
                </p>
              : null}
            </div>
          </>
        : phase === 'loading' ?
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f7f2]">
              <Shield className="h-11 w-11 animate-pulse text-[#18a87c]" strokeWidth={1.75} />
            </div>
            <p className="mt-10 text-base font-semibold text-[#0d2b1f]">Zertifikat wird ausgestellt…</p>
          </>
        : phase === 'error' && error ?
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <span className="text-2xl font-bold">!</span>
            </div>
            <h1 className="mt-8 text-xl font-extrabold text-[#0d2b1f]">{error.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#5a7a6e]">{error.body}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={error.href}
                className="inline-flex items-center justify-center rounded-xl bg-[#18a87c] px-6 py-3 text-sm font-bold text-white shadow-md hover:opacity-95"
              >
                {error.cta}
              </Link>
              {eligible ?
                <button
                  type="button"
                  onClick={() => {
                    setPhase('ready')
                    setError(null)
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
