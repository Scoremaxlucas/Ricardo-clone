'use client'

import { landlordDecideMatchingApplicationAction } from '@/lib/matching/matching-application-actions'
import type { LandlordStagedSeekerView } from '@/lib/matching/matching-landlord-view'
import { MatchingApplicationStatus } from '@prisma/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import toast from 'react-hot-toast'

export function MatchingLandlordApplicationClient(props: {
  applicationId: string
  status: MatchingApplicationStatus
  message: string | null
  property: {
    title: string
    city: string
    zip: string
    canton: string
    rentPerMonth: number
    rooms: number | null
  }
  match: { score: number; reasons: { code: string; detail: string | null }[] } | null
  stagedSeeker: LandlordStagedSeekerView
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const decide = (decision: 'accepted' | 'rejected') => {
    if (decision === 'rejected' && !confirm('Bewerbung ablehnen?')) return
    startTransition(() => {
      void (async () => {
        const res = await landlordDecideMatchingApplicationAction({ applicationId: props.applicationId, decision })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success(decision === 'accepted' ? 'Angenommen.' : 'Abgelehnt.')
        router.refresh()
      })()
    })
  }

  const canDecide =
    props.status === MatchingApplicationStatus.submitted ||
    props.status === MatchingApplicationStatus.landlord_reviewing

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Objekt</h2>
        <p className="mt-1 font-medium text-slate-800">{props.property.title}</p>
        <p className="text-sm text-slate-600">
          {props.property.zip} {props.property.city} · {props.property.canton}
          {props.property.rooms != null ? ` · ${props.property.rooms} Zi.` : null} · CHF {props.property.rentPerMonth}{' '}
          / Monat
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Bewerbung: <span className="font-medium">{props.status}</span>
        </p>
      </section>

      {props.match ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Treffer-Score</h2>
          <p className="mt-1 text-2xl font-bold text-teal-800">{Math.round(props.match.score)}</p>
          {props.match.reasons.length > 0 ? (
            <ul className="mt-3 list-inside list-disc text-sm text-slate-600">
              {props.match.reasons.map(r => (
                <li key={r.code + (r.detail ?? '')}>
                  <span className="font-mono text-xs text-slate-500">{r.code}</span>
                  {r.detail ? ` — ${r.detail}` : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Nachricht der Suchenden</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{props.message || '— keine —'}</p>
      </section>

      <section className="rounded-xl border border-amber-100 bg-amber-50/80 p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-950">Gestufte Sicht (nur mit Freigabe)</h2>
        {props.stagedSeeker.lockedScopes.length > 0 ? (
          <p className="mt-2 text-sm text-amber-900">
            Noch nicht freigegeben:{' '}
            {props.stagedSeeker.lockedScopes.join(', ')}
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-900">Alle definierten Bereiche sind freigegeben.</p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Suchende:r (freigegebene Daten)</h2>
        {props.stagedSeeker.identity ? (
          <div className="mt-2 text-sm text-slate-700">
            <p>
              <span className="font-medium">Name:</span> {props.stagedSeeker.identity.displayName ?? '—'}
            </p>
            <p>
              <span className="font-medium">E-Mail:</span> {props.stagedSeeker.identity.email}
            </p>
            {props.stagedSeeker.identity.phone ? (
              <p>
                <span className="font-medium">Telefon:</span> {props.stagedSeeker.identity.phone}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Kontaktdaten noch nicht freigegeben.</p>
        )}

        {props.stagedSeeker.searchProfile ? (
          <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
            <h3 className="font-semibold text-slate-900">Suchprofil</h3>
            <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-3 text-xs">
              {JSON.stringify(props.stagedSeeker.searchProfile, null, 2)}
            </pre>
          </div>
        ) : null}

        {props.stagedSeeker.household ? (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-medium">Haushalt:</span> {props.stagedSeeker.household.adults} Erw.,{' '}
            {props.stagedSeeker.household.children} Kinder
          </p>
        ) : null}

        {props.stagedSeeker.householdPets != null ? (
          <p className="mt-2 text-sm text-slate-700">
            <span className="font-medium">Haustiere:</span> {props.stagedSeeker.householdPets || '—'}
          </p>
        ) : null}

        {props.stagedSeeker.employment ? (
          <div className="mt-4 text-sm text-slate-700">
            <h3 className="font-semibold text-slate-900">Beruf</h3>
            <p>{props.stagedSeeker.employment.employmentStatus ?? '—'}</p>
            <p>{props.stagedSeeker.employment.employerName ?? ''}</p>
          </div>
        ) : null}

        {props.stagedSeeker.financial ? (
          <p className="mt-4 text-sm text-slate-700">
            <span className="font-medium">Einkommen (Band):</span>{' '}
            {props.stagedSeeker.financial.monthlyNetIncomeBand ?? '—'}
          </p>
        ) : null}

        {props.stagedSeeker.housingHistory && props.stagedSeeker.housingHistory.length > 0 ? (
          <div className="mt-4 text-sm text-slate-700">
            <h3 className="font-semibold text-slate-900">Wohnhistorie</h3>
            <ul className="mt-2 list-inside list-disc">
              {props.stagedSeeker.housingHistory.map((h, i) => (
                <li key={i}>
                  {h.label ?? 'Eintrag'} {h.fromDate ?? ''} – {h.toDate ?? ''}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {props.stagedSeeker.documents && props.stagedSeeker.documents.length > 0 ? (
          <div className="mt-4 text-sm">
            <h3 className="font-semibold text-slate-900">Nachweise</h3>
            <ul className="mt-2 space-y-2">
              {props.stagedSeeker.documents.map((d, i) => (
                <li key={i}>
                  <span className="text-slate-700">
                    {d.kind} ({d.status})
                  </span>{' '}
                  <a
                    href={d.fileKey}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-800 underline-offset-2 hover:underline"
                  >
                    öffnen
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {canDecide ? (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => decide('accepted')}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            Annehmen
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => decide('rejected')}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
          >
            Ablehnen
          </button>
        </div>
      ) : null}

      <p className="text-sm text-slate-500">
        <Link href="/matching/landlord/applications" className="text-teal-800 hover:underline">
          Zurück zur Liste
        </Link>
      </p>
    </div>
  )
}
