'use client'

import { MATCHING_CONSENT_SCOPES, isConsentEffective, type ConsentRow } from '@/lib/matching/consent-scopes'
import {
  setMatchingConsentShareAction,
  submitMatchingApplicationAction,
  updateMatchingApplicationMessageAction,
  withdrawMatchingApplicationAction,
} from '@/lib/matching/matching-application-actions'
import { MatchingApplicationStatus } from '@prisma/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import toast from 'react-hot-toast'

const SCOPE_LABELS: Record<string, string> = {
  seeker_identity: 'Kontakt (Name, E-Mail, Telefon)',
  search_profile: 'Suchkriterien',
  household: 'Haushalt (Anzahl Personen)',
  household_pets: 'Haustiere (Text)',
  employment: 'Beruf / Arbeitgeber',
  financial: 'Einkommensband',
  housing_history: 'Wohnhistorie',
  documents_view: 'Nachweise (Dateilinks)',
}

export function MatchingSeekerApplicationClient(props: {
  applicationId: string
  status: MatchingApplicationStatus
  message: string | null
  propertyTitle: string
  propertyCity: string
  matchScore: number | null
  consentShares: ConsentRow[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState(props.message ?? '')

  const effective = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const c of props.consentShares) {
      m.set(c.scope, isConsentEffective(c))
    }
    return m
  }, [props.consentShares])

  const toggle = (scope: string, granted: boolean) => {
    startTransition(() => {
      void (async () => {
        const res = await setMatchingConsentShareAction({
          applicationId: props.applicationId,
          scope,
          granted,
        })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success(granted ? 'Freigabe erteilt.' : 'Freigabe widerrufen.')
        router.refresh()
      })()
    })
  }

  const saveMessage = () => {
    startTransition(() => {
      void (async () => {
        const res = await updateMatchingApplicationMessageAction({
          applicationId: props.applicationId,
          message,
        })
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success('Nachricht gespeichert.')
        router.refresh()
      })()
    })
  }

  const submit = () => {
    startTransition(() => {
      void (async () => {
        const res = await submitMatchingApplicationAction(props.applicationId)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success('Bewerbung eingereicht.')
        router.refresh()
      })()
    })
  }

  const withdraw = () => {
    if (!confirm('Bewerbung wirklich zurückziehen?')) return
    startTransition(() => {
      void (async () => {
        const res = await withdrawMatchingApplicationAction(props.applicationId)
        if (!res.ok) {
          toast.error(res.error)
          return
        }
        toast.success('Zurückgezogen.')
        router.push('/matching/applications')
      })()
    })
  }

  const isDraft = props.status === MatchingApplicationStatus.draft
  const canEdit = isDraft || props.status === MatchingApplicationStatus.submitted
  const canConsent =
    props.status !== MatchingApplicationStatus.withdrawn &&
    props.status !== MatchingApplicationStatus.closed &&
    props.status !== MatchingApplicationStatus.landlord_rejected

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Objekt</h2>
        <p className="mt-1 text-slate-700">
          {props.propertyTitle} — {props.propertyCity}
        </p>
        {props.matchScore != null ? (
          <p className="mt-2 text-sm text-slate-500">Treffer-Score: {Math.round(props.matchScore)}</p>
        ) : null}
        <p className="mt-2 text-sm text-slate-600">
          Status: <span className="font-medium text-slate-800">{props.status}</span>
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Deine Nachricht</h2>
        <textarea
          disabled={!isDraft}
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
          rows={4}
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        {isDraft ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={saveMessage}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              Speichern
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={submit}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
            >
              Einreichen
            </button>
          </div>
        ) : null}
      </section>

      {canConsent ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Freigaben an den Vermieter</h2>
          <p className="mt-2 text-sm text-slate-600">
            Erst nach deiner expliziten Freigabe sieht der Vermieter die jeweiligen Daten. Du kannst Freigaben
            jederzeit widerrufen (solange die Bewerbung nicht beendet ist).
          </p>
          <ul className="mt-4 space-y-3">
            {MATCHING_CONSENT_SCOPES.map(scope => (
              <li
                key={scope}
                className="flex flex-col gap-2 border-b border-slate-100 pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm text-slate-800">{SCOPE_LABELS[scope] ?? scope}</span>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={effective.get(scope) ?? false}
                    disabled={isPending}
                    onChange={e => toggle(scope, e.target.checked)}
                  />
                  <span className="text-slate-600">freigeben</span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {canEdit && props.status !== MatchingApplicationStatus.withdrawn ? (
        <p>
          <button
            type="button"
            disabled={isPending}
            onClick={withdraw}
            className="text-sm font-medium text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
          >
            Bewerbung zurückziehen
          </button>
        </p>
      ) : null}

      <p className="text-sm text-slate-500">
        <Link href="/matching/applications" className="text-teal-800 hover:underline">
          Alle Bewerbungen
        </Link>
        {' · '}
        <Link href="/matching/matches" className="text-teal-800 hover:underline">
          Treffer
        </Link>
      </p>
    </div>
  )
}
