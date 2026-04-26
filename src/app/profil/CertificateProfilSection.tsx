'use client'

import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { formatDate } from '@/lib/utils/formatDate'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useCallback, useState } from 'react'

export type CertificateProfilProps = {
  activeCertificate: {
    certificateCode: string
    expiresAt: string
  } | null
  eligible: boolean
  checklist: {
    profileComplete: boolean
    creditOk: boolean
  }
  firstName: string
}

export function CertificateProfilSection({
  activeCertificate,
  eligible,
  checklist,
  firstName,
}: CertificateProfilProps) {
  const [busy, setBusy] = useState(false)
  const verifyUrl = `${WOHNEN_SITE_ORIGIN.replace(/\/$/, '')}/verify/${activeCertificate?.certificateCode ?? ''}`

  const copyLink = useCallback(async () => {
    if (!activeCertificate) return
    try {
      await navigator.clipboard.writeText(verifyUrl)
      toast.success('Link kopiert ✓')
    } catch {
      toast.error('Kopieren fehlgeschlagen')
    }
  }, [activeCertificate, verifyUrl])

  const share = useCallback(async () => {
    if (!activeCertificate) return
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Helvenda Qualitätsnachweis',
          text: `Mein Helvenda Qualitätsnachweis: ${activeCertificate.certificateCode}`,
          url: verifyUrl,
        })
      } else {
        await navigator.clipboard.writeText(verifyUrl)
        toast.success('Link kopiert ✓')
      }
    } catch {
      /* user cancelled share */
    }
  }, [activeCertificate, verifyUrl])

  const downloadPdf = useCallback(() => {
    if (!activeCertificate) return
    const u = `/api/certificate/${encodeURIComponent(activeCertificate.certificateCode)}/pdf`
    window.open(u, '_blank', 'noopener,noreferrer')
  }, [activeCertificate])

  const revoke = useCallback(async () => {
    if (!window.confirm('Zertifikat wirklich widerrufen? Der Verifikationslink funktioniert danach nicht mehr.')) return
    setBusy(true)
    try {
      const res = await fetch('/api/certificate/revoke', { method: 'POST', credentials: 'same-origin' })
      if (!res.ok) {
        toast.error('Widerruf fehlgeschlagen')
        return
      }
      toast.success('Zertifikat widerrufen')
      window.location.reload()
    } finally {
      setBusy(false)
    }
  }, [])

  const expires = activeCertificate ? new Date(activeCertificate.expiresAt) : null
  const daysLeft = expires ? Math.ceil((expires.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null
  const warnExpiry = daysLeft != null && daysLeft >= 0 && daysLeft < 14

  if (activeCertificate) {
    return (
      <section className="mt-10 rounded-[20px] bg-gradient-to-br from-[#0d2b1f] to-[#107a5a] p-7 text-white shadow-lg sm:p-8">
        <div className="flex gap-4">
          <ShieldCheck className="h-8 w-8 shrink-0 text-teal-100" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold sm:text-xl">Helvenda Qualitätsnachweis</h2>
            <p className="mt-2 font-mono text-sm text-teal-100/95">
              {activeCertificate.certificateCode} · Gültig bis {formatDate(activeCertificate.expiresAt)}
            </p>
            {warnExpiry ?
              <p className="mt-3 text-sm font-semibold text-amber-200">
                Läuft in {daysLeft} Tag{daysLeft === 1 ? '' : 'en'} ab — Betreibungsregister erneuern
              </p>
            : null}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={downloadPdf}
                className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
              >
                PDF herunterladen
              </button>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
              >
                Link kopieren
              </button>
              <button
                type="button"
                onClick={() => void share()}
                className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/25"
              >
                Teilen
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void revoke()}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-200 underline-offset-2 hover:underline disabled:opacity-50"
              >
                Widerrufen
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (eligible) {
    return (
      <section className="mt-10 rounded-[20px] border-2 border-[#18a87c] bg-[#e8f7f2] p-7 sm:p-8">
        <h2 className="text-lg font-bold text-[#0d2b1f] sm:text-xl">Helvenda Qualitätsnachweis</h2>
        <p className="mt-2 font-semibold text-[#107a5a]">Hebe dich von anderen Bewerbern ab.</p>
        <p className="mt-4 text-sm leading-relaxed text-[#0d2b1f]">
          Hallo {firstName}, dein Profil ist vollständig und dein Betreibungsregister ist verifiziert. Du kannst jetzt
          deinen persönlichen Qualitätsnachweis ausstellen lassen.
        </p>
        <Link
          href="/zertifikat"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#18a87c] px-6 py-3 text-sm font-bold text-white shadow-md hover:opacity-95"
        >
          Zertifikat jetzt ausstellen
        </Link>
      </section>
    )
  }

  return (
    <section className="mt-10 rounded-[20px] border border-slate-200 bg-slate-50/80 p-7 sm:p-8">
      <h2 className="text-lg font-bold text-[#0d2b1f]">Helvenda Qualitätsnachweis</h2>
      <p className="mt-4 text-sm font-medium text-slate-700">Für deinen Qualitätsnachweis benötigst du:</p>
      <ul className="mt-4 space-y-3 text-sm">
        <li className="flex flex-wrap items-center justify-between gap-2">
          <span>{checklist.profileComplete ? '✓' : '○'} Vollständiges Profil</span>
          {checklist.profileComplete ?
            <span className="text-emerald-700">Erledigt</span>
          : <Link href="/profil/bearbeiten" className="font-semibold text-teal-800 underline">Vervollständigen</Link>}
        </li>
        <li className="flex flex-wrap items-center justify-between gap-2">
          <span>{checklist.creditOk ? '✓' : '○'} Gültiges Betreibungsregister</span>
          {checklist.creditOk ?
            <span className="text-emerald-700">Erledigt</span>
          : <Link href="/profil/betreibungsregister" className="font-semibold text-teal-800 underline">Jetzt hochladen</Link>}
        </li>
      </ul>
    </section>
  )
}
