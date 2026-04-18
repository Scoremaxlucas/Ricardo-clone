'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  listingId: string
  rentPerMonth: number
  requiresCreditCheck: boolean
  userId: string | null
  profileComplete: boolean
  creditCheckOk: boolean
  /** Profil + ggf. Betreibungsregister erfüllt */
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

  const bewerbenPath = `/wohnungen/${listingId}/bewerben`

  const onPrimaryClick = () => {
    if (isOwner) return
    if (!userId) {
      setModal(true)
      return
    }
    if (!profileComplete) {
      router.push(`/profil/erstellen?next=${encodeURIComponent(bewerbenPath)}`)
      return
    }
    if (requiresCreditCheck && !creditCheckOk) {
      router.push(
        `/profil/betreibungsregister?next=${encodeURIComponent(bewerbenPath)}&reason=required`
      )
      return
    }
    if (alreadyApplied) return
    router.push(bewerbenPath)
  }

  if (isOwner) {
    return (
      <div className={`rounded-2xl border border-slate-200 bg-white shadow-lg ${compact ? 'p-4' : 'p-6'}`}>
        <p className="text-center text-sm font-medium text-slate-600">Das ist dein eigenes Inserat.</p>
      </div>
    )
  }

  const label = (() => {
    if (!userId) return 'Jetzt bewerben'
    if (!profileComplete) return 'Profil erstellen & bewerben'
    if (requiresCreditCheck && !creditCheckOk) return 'Betreibungsregister hochladen'
    if (alreadyApplied) return 'Bereits beworben ✓'
    return 'Jetzt bewerben'
  })()

  const disabled = Boolean(userId && alreadyApplied)
  const isTealPrimary = userId && tenantApplyReady && !alreadyApplied

  return (
    <>
      <div
        className={`rounded-2xl border border-slate-200 bg-white shadow-lg ring-1 ring-slate-100 ${
          compact ? 'p-4 ring-0' : 'p-6'
        }`}
      >
        {!compact ?
          <div className="h-1 w-full rounded-full bg-[#18a87c]" aria-hidden />
        : null}
        <p
          className={`text-center font-bold text-slate-900 ${compact ? 'text-lg' : 'mt-4 text-2xl'}`}
        >
          CHF {rentPerMonth.toLocaleString('de-CH')}.—{' '}
          <span className={`font-semibold text-slate-600 ${compact ? 'text-sm' : 'text-base'}`}>/ Monat</span>
        </p>

        {requiresCreditCheck && !compact ?
          <div className="mt-4 rounded-xl bg-teal-50 px-3 py-3 text-xs leading-relaxed text-teal-900">
            📄 Dieser Vermieter verlangt einen Betreibungsregisterauszug. Lade ihn einmalig in deinem Profil hoch — er
            gilt für alle deine Bewerbungen.
          </div>
        : null}

        <button
          type="button"
          onClick={onPrimaryClick}
          disabled={disabled}
          className={
            disabled
              ? `${compact ? 'mt-3' : 'mt-5'} w-full min-h-[44px] cursor-not-allowed rounded-xl bg-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-600`
              : isTealPrimary
                ? `${compact ? 'mt-3' : 'mt-5'} w-full min-h-[44px] rounded-xl bg-[#18a87c] px-4 py-3 text-center text-sm font-bold text-white shadow-md transition hover:opacity-95`
                : `${compact ? 'mt-3' : 'mt-5'} w-full min-h-[44px] rounded-xl border-2 border-teal-700 bg-white px-4 py-3 text-center text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50`
          }
        >
          {label}
        </button>

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
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
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
