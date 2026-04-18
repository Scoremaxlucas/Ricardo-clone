'use client'

import { createMatchingApplicationFromMatchAction } from '@/lib/matching/matching-application-actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import toast from 'react-hot-toast'

export type SeekerMatchRow = {
  matchId: string
  score: number
  property: {
    id: string
    title: string
    city: string
    zip: string
    canton: string
    rentPerMonth: number
    rooms: number | null
  }
  application: { id: string; status: string } | null
}

export function MatchingSeekerMatchesClient({ matches }: { matches: SeekerMatchRow[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [msgByMatch, setMsgByMatch] = useState<Record<string, string>>({})

  const apply = (matchId: string) => {
    const message = msgByMatch[matchId]?.trim() || null
    startTransition(() => {
      void (async () => {
        const res = await createMatchingApplicationFromMatchAction({ housingMatchId: matchId, message })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success('Bewerbung angelegt.')
        if (res.applicationId) {
          router.push(`/matching/applications/${res.applicationId}`)
        }
        router.refresh()
      })()
    })
  }

  if (matches.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        Keine aktiven Treffer. Vervollständige dein{' '}
        <Link href="/matching/onboarding" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Suchprofil
        </Link>
        .
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {matches.map(m => (
        <div
          key={m.matchId}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-start sm:justify-between sm:gap-4"
        >
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900">{m.property.title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {m.property.zip} {m.property.city} · {m.property.canton} ·{' '}
              {m.property.rooms != null ? `${m.property.rooms} Zi. · ` : null}
              CHF{' '}
              {m.property.rentPerMonth} / Monat
            </p>
            <p className="mt-2 text-xs text-slate-500">Match-Score: {Math.round(m.score)}</p>
            {m.application ? (
              <p className="mt-2 text-sm">
                <Link
                  href={`/matching/applications/${m.application.id}`}
                  className="font-medium text-teal-800 underline-offset-2 hover:underline"
                >
                  Bewerbung ansehen ({m.application.status})
                </Link>
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                <label className="block text-xs font-medium text-slate-700">Nachricht (optional)</label>
                <textarea
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Kurz vorstellen …"
                  value={msgByMatch[m.matchId] ?? ''}
                  onChange={e => setMsgByMatch(x => ({ ...x, [m.matchId]: e.target.value }))}
                />
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => apply(m.matchId)}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  Bewerben
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
