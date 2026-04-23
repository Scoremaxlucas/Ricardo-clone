'use client'

import Link from 'next/link'
import type { QualificationIssue } from '@/lib/rental/qualifyTenant'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  listingId: string
  rentPerMonth: number
  requiresCreditCheck: boolean
  userId: string | null
  profileComplete: boolean
  creditCheckOk: boolean
  /** Profil + ggf. Betreibungsregisterauszug erfüllt */
  tenantApplyReady: boolean
  /** Bereits eine laufende / genehmigte Bewerbung auf dieses Inserat */
  alreadyApplied: boolean
  isOwner: boolean
  /** Kompakte Darstellung für fixierte Mobile-Leiste */
  compact?: boolean
}

export function WohnungBewerbungsBox({
  listingId,
  rentPerMonth,
  requiresCreditCheck,
  userId,
  profileComplete,
  creditCheckOk,
  tenantApplyReady,
  alreadyApplied,
  isOwner,
  compact = false,
}: Props) {
  const router = useRouter()
  const [modal, setModal] = useState(false)
  const [qualifying, setQualifying] = useState(false)
  const [qualified, setQualified] = useState<boolean | null>(null)
  const [issues, setIssues] = useState<QualificationIssue[]>([])

  const bewerbenPath = `/wohnungen/${listingId}/bewerben`

  useEffect(() => {
    if (!userId || isOwner || alreadyApplied) return
    let cancelled = false
    setQualifying(true)
    ;(async () => {
      try {
        const res = await fetch(`/api/rental-applications/qualify?listingId=${encodeURIComponent(listingId)}`, {
          credentials: 'same-origin',
        })
        const data = (await res.json().catch(() => ({}))) as {
          qualified?: boolean
          issues?: QualificationIssue[]
          requiresLogin?: boolean
        }
        if (cancelled) return
        if (data.requiresLogin) {
          setQualified(null)
          setIssues([])
          return
        }
        setQualified(data.qualified === true)
        setIssues(Array.isArray(data.issues) ? data.issues : [])
      } catch {
        if (!cancelled) {
          setQualified(tenantApplyReady)
          setIssues([])
        }
      } finally {
        if (!cancelled) setQualifying(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, isOwner, alreadyApplied, listingId, tenantApplyReady])

  const blockingCount = useMemo(() => issues.filter(i => i.blocking).length, [issues])
  const isQualifiedNow = userId ? (qualified ?? tenantApplyReady) : false
  const notQualified = Boolean(userId && !alreadyApplied && !isQualifiedNow)

  const onPrimaryClick = () => {
    if (isOwner) return
    if (!userId) {
      setModal(true)
      return
    }
    if (notQualified) {
      router.push(bewerbenPath)
      return
    }
    if (alreadyApplied) return
    router.push(bewerbenPath)
  }

  if (isOwner) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white shadow-lg ${compact ? 'border-0 p-0 shadow-none ring-0' : 'p-6'}`}>
        <p className={`text-center text-sm font-medium text-slate-600 ${compact ? 'py-2' : ''}`}>
          Das ist dein eigenes Inserat.
        </p>
      </div>
    )
  }

  const label = (() => {
    if (!userId) return 'Anmelden zum Bewerben'
    if (alreadyApplied) return 'Bereits beworben ✓'
    if (notQualified) return 'Anforderungen prüfen'
    return 'Jetzt bewerben'
  })()

  const disabled = Boolean(userId && alreadyApplied)
  const isTealPrimary = (!userId || isQualifiedNow) && !alreadyApplied

  const primaryBtnClass = (() => {
    const base = 'min-h-[48px] shrink-0 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition sm:min-h-[44px]'
    if (disabled) {
      return `${base} cursor-not-allowed bg-slate-300 text-slate-600`
    }
    if (notQualified) {
      return `${base} bg-orange-500 text-white shadow-md hover:bg-orange-600`
    }
    if (isTealPrimary) {
      return `${base} bg-[#18a87c] text-white shadow-md hover:opacity-95`
    }
    return `${base} border-2 border-teal-700 bg-white text-teal-800 shadow-sm hover:bg-teal-50`
  })()

  return (
    <>
      <div
        className={`rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-100 ${
          compact ? 'border-0 p-0 shadow-none ring-0' : 'p-6'
        }`}
      >
        {!compact ?
          <div className="h-1 w-full rounded-full bg-[#18a87c]" aria-hidden />
        : null}

        {compact ?
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-left text-base font-bold leading-tight text-slate-900">
              CHF {rentPerMonth.toLocaleString('de-CH')}.—
              <span className="block text-xs font-semibold text-slate-600">/ Monat</span>
            </p>
            <button type="button" onClick={onPrimaryClick} disabled={disabled} className={`${primaryBtnClass} max-w-[58%]`}>
              {qualifying ? 'Prüfe…' : label}
            </button>
          </div>
        : (
          <>
            <p className="mt-4 text-center text-2xl font-bold text-slate-900">
              CHF {rentPerMonth.toLocaleString('de-CH')}.—{' '}
              <span className="text-base font-semibold text-slate-600">/ Monat</span>
            </p>

            {requiresCreditCheck ?
              <div className="mt-4 rounded-xl bg-teal-50 px-3 py-3 text-xs leading-relaxed text-teal-900">
                📄 Dieser Vermieter verlangt einen Betreibungsregisterauszug. Lade ihn einmalig in deinem Profil hoch — er
                gilt für alle deine Bewerbungen.
              </div>
            : null}

            <button type="button" onClick={onPrimaryClick} disabled={disabled} className={`${primaryBtnClass} mt-5 w-full`}>
              {qualifying ? 'Prüfe Anforderungen…' : label}
            </button>
          </>
        )}
        {!compact && userId && !alreadyApplied && notQualified && blockingCount > 0 ? (
          <p className="mt-2 text-center text-xs font-medium text-orange-700">
            {blockingCount} {blockingCount === 1 ? 'Punkt ausstehend' : 'Punkte ausstehend'}
          </p>
        ) : null}
        {!compact && userId && !alreadyApplied && isQualifiedNow ? (
          <p className="mt-2 text-center text-xs font-medium text-emerald-700">✓ Du erfüllst alle Anforderungen</p>
        ) : null}

        {!compact ?
          <p className="mt-4 text-center text-[11px] text-slate-500">🔒 Deine Daten werden verschlüsselt übertragen</p>
        : null}
      </div>

      {modal ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wohnung-login-title"
        >
          <div className="wohnen-bottom-sheet-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[20px] bg-white px-5 pb-6 pt-2 shadow-xl sm:rounded-2xl sm:px-6 sm:pt-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e0e0e0] sm:hidden" aria-hidden />
            <h2 id="wohnung-login-title" className="text-lg font-bold text-slate-900">
              Melde dich an oder registriere dich um dich zu bewerben
            </h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(bewerbenPath)}`}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-[#18a87c] px-4 py-3 text-sm font-semibold text-white"
                onClick={() => setModal(false)}
              >
                Anmelden
              </Link>
              <Link
                href={`/register?callbackUrl=${encodeURIComponent(bewerbenPath)}`}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border-2 border-teal-700 px-4 py-3 text-sm font-semibold text-teal-800"
                onClick={() => setModal(false)}
              >
                Registrieren
              </Link>
            </div>
            <button
              type="button"
              className="mt-4 w-full min-h-[44px] text-sm text-slate-500 hover:text-slate-800"
              onClick={() => setModal(false)}
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
