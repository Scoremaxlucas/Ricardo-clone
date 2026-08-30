'use client'

import {
  formatSicFunnelHours,
  SIC_FUNNEL_DAY_OPTIONS,
  type SicFunnelDays,
  type SicFunnelView,
} from '@/lib/sic/funnel'
import { useCallback, useEffect, useState } from 'react'

export function SicAdminFunnel() {
  const [days, setDays] = useState<SicFunnelDays>(30)
  const [funnel, setFunnel] = useState<SicFunnelView | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (next: SicFunnelDays) => {
    setError(null)
    try {
      const res = await fetch(`/api/sic/admin/funnel?days=${next}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) throw new Error(data?.message || 'Funnel nicht geladen.')
      setFunnel(data.funnel as SicFunnelView)
    } catch (err) {
      setFunnel(null)
      setError(err instanceof Error ? err.message : 'Funnel nicht geladen.')
    }
  }, [])

  useEffect(() => {
    void load(days)
  }, [days, load])

  return (
    <section className="mt-4 rounded-xl border border-sic-navy/10 bg-sic-paper px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-sic-navy">Funnel</p>
        <div className="flex gap-1">
          {SIC_FUNNEL_DAY_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                days === option ? 'bg-sic-navy text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {option} Tage
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">
        Wer in diesem Zeitraum bezahlt hat, und wie weit dasselbe Zertifikat gekommen ist.
      </p>

      {error ?
        <p className="mt-2 text-xs text-sic-danger-text">{error}</p>
      : !funnel ?
        <p className="mt-2 text-xs text-slate-400">Laden…</p>
      : <>
          <ol className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {funnel.steps.map(step => (
              <li key={step.id} className="rounded-lg border border-sic-hairline bg-white px-3 py-2">
                <p className="text-[11px] font-medium text-slate-500">{step.label}</p>
                <p className="mt-0.5 font-sic-serif text-xl font-semibold text-sic-navy">{step.unique}</p>
                <p className="text-[11px] text-slate-400">
                  {step.fromPreviousPct == null ? 'Ausgangspunkt' : `${step.fromPreviousPct} % der Vorstufe`}
                </p>
              </li>
            ))}
          </ol>
          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <div>
              <dt className="inline">Bezahlen → Upload </dt>
              <dd className="inline font-semibold text-sic-navy">
                {formatSicFunnelHours(funnel.timing.medianHoursPaidToUpload)}
              </dd>
            </div>
            <div>
              <dt className="inline">Upload → Freigabe </dt>
              <dd className="inline font-semibold text-sic-navy">
                {formatSicFunnelHours(funnel.timing.medianHoursUploadToVerified)}
              </dd>
            </div>
            <div>
              <dt className="inline">Abgelehnt </dt>
              <dd className="inline font-semibold text-sic-navy">{funnel.extras.rejectedCertificates}</dd>
            </div>
            <div>
              <dt className="inline">Vermieter-Scans </dt>
              <dd className="inline font-semibold text-sic-navy">{funnel.extras.landlordScans}</dd>
            </div>
            {funnel.extras.revoked > 0 ?
              <div>
                <dt className="inline">Widerrufen </dt>
                <dd className="inline font-semibold text-sic-danger-text">{funnel.extras.revoked}</dd>
              </div>
            : null}
          </dl>
        </>
      }
    </section>
  )
}
