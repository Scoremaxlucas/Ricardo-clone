'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  listingId: string
  rentPerMonth: number
  requiresCreditCheck: boolean
  userId: string | null
  /** Profil vollständig gespeichert (isComplete) */
  profileComplete: boolean
  /** Betreibungsregister gültig (APPROVED + nicht abgelaufen), falls erforderlich */
  creditCheckOk: boolean
  /** Mieter kann sich technisch bewerben (Phase 4 folgt) */
  tenantApplyReady: boolean
  isOwner: boolean
}

export function WohnungBewerbungsBox({
  listingId,
  rentPerMonth,
  requiresCreditCheck,
  userId,
  profileComplete,
  creditCheckOk,
  tenantApplyReady,
  isOwner,
}: Props) {
  const router = useRouter()
  const [modal, setModal] = useState(false)

  const detailPath = `/wohnungen/${listingId}`

  const onPrimaryClick = () => {
    if (isOwner) return
    if (!userId) {
      setModal(true)
      return
    }
    if (!profileComplete) {
      router.push(`/profil/erstellen?next=${encodeURIComponent(detailPath)}`)
      return
    }
    if (requiresCreditCheck && !creditCheckOk) {
      router.push('/profil/betreibungsregister')
      return
    }
    // Phase 4: /wohnungen/[id]/bewerben
  }

  if (isOwner) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <p className="text-center text-sm font-medium text-slate-600">Das ist dein eigenes Inserat.</p>
      </div>
    )
  }

  const showComingSoon = Boolean(userId && tenantApplyReady)

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg ring-1 ring-slate-100">
        <div className="h-1 w-full rounded-full bg-[#18a87c]" aria-hidden />
        <p className="mt-4 text-center text-2xl font-bold text-slate-900">
          CHF {rentPerMonth.toLocaleString('de-CH')}.— <span className="text-base font-semibold">/ Monat</span>
        </p>

        {requiresCreditCheck ? (
          <div className="mt-4 rounded-xl bg-teal-50 px-3 py-3 text-xs leading-relaxed text-teal-900">
            📄 Dieser Vermieter verlangt einen Betreibungsregisterauszug. Lade ihn einmalig in deinem Profil hoch — er
            gilt für alle deine Bewerbungen.
          </div>
        ) : null}

        {showComingSoon ? (
          <button
            type="button"
            disabled
            className="mt-5 w-full cursor-not-allowed rounded-xl bg-slate-300 px-4 py-3.5 text-center text-sm font-bold text-slate-600"
          >
            Bewerben (bald verfügbar)
          </button>
        ) : (
          <button
            type="button"
            onClick={onPrimaryClick}
            className="mt-5 w-full rounded-xl bg-[#18a87c] px-4 py-3.5 text-center text-sm font-bold text-white shadow-md transition hover:opacity-95"
          >
            Jetzt bewerben
          </button>
        )}

        <p className="mt-4 text-center text-[11px] text-slate-500">🔒 Deine Daten werden verschlüsselt übertragen</p>
      </div>

      {modal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wohnung-login-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="wohnung-login-title" className="text-lg font-bold text-slate-900">
              Melde dich an oder registriere dich um dich zu bewerben
            </h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(detailPath)}`}
                className="inline-flex flex-1 justify-center rounded-xl bg-[#18a87c] px-4 py-3 text-sm font-semibold text-white"
                onClick={() => setModal(false)}
              >
                Anmelden
              </Link>
              <Link
                href={`/register?callbackUrl=${encodeURIComponent(detailPath)}`}
                className="inline-flex flex-1 justify-center rounded-xl border-2 border-teal-700 px-4 py-3 text-sm font-semibold text-teal-800"
                onClick={() => setModal(false)}
              >
                Registrieren
              </Link>
            </div>
            <button
              type="button"
              className="mt-4 w-full text-sm text-slate-500 hover:text-slate-800"
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
