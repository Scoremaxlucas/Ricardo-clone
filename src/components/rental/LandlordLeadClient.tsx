'use client'

import { CreditCheckBadge } from '@/components/rental/CreditCheckBadge'
import type { LandlordLeadApplicationView } from '@/lib/rental/landlord-lead-application-view'
import { employmentSummaryDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import type { EmploymentStatus, IncomeCategory } from '@prisma/client'
import { wohnenToast } from '@/lib/wohnen-toast'
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

type Props = {
  token: string
  initial: LandlordLeadApplicationView
}

function timeOptions(): string[] {
  const out: string[] = []
  for (let h = 8; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return out
}

export function LandlordLeadClient({ token, initial }: Props) {
  const [view, setView] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [viewModal, setViewModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [contactModal, setContactModal] = useState(false)
  const [viewDate, setViewDate] = useState('')
  const [viewTime, setViewTime] = useState('10:00')
  const [viewNote, setViewNote] = useState('')
  const [contactNote, setContactNote] = useState('')

  const rejected = view.status === 'rejected' || view.rejectedAt != null
  const hasViewing = view.viewingRequestedAt != null
  const responded = view.landlordRespondedAt != null
  const times = useMemo(() => timeOptions(), [])
  const minDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const creditParsed: CreditCheckResult | null = isCreditCheckResult(view.applicant.creditCheckResult)
    ? view.applicant.creditCheckResult
    : null

  const empLine = employmentSummaryDe(
    view.applicant.employmentStatus as EmploymentStatus,
    view.applicant.employer,
    null,
    null
  )
  const incomeLine = incomeCategoryLabelDe(view.applicant.incomeCategory as IncomeCategory)

  const patch = useCallback(
    async (body: Record<string, unknown>) => {
      setBusy(true)
      try {
        const res = await fetch(`/api/public/landlord-lead/${encodeURIComponent(token)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = (await res.json().catch(() => ({}))) as {
          message?: string
          application?: LandlordLeadApplicationView
        }
        if (!res.ok) {
          toast.error(data.message || 'Aktion fehlgeschlagen')
          return
        }
        if (data.application) setView(data.application)
        if (body.action === 'request_viewing') wohnenToast.viewingRequested()
        else if (body.action === 'reject') wohnenToast.applicationRejected()
        else if (body.action === 'contact_directly') toast.success('Der Bewerber wurde informiert.')
        setViewModal(false)
        setRejectModal(false)
        setContactModal(false)
      } catch {
        wohnenToast.genericError()
      } finally {
        setBusy(false)
      }
    },
    [token]
  )

  const onSubmitViewing = () => {
    const [y, mo, d] = viewDate.split('-').map(Number)
    const [hh, mm] = viewTime.split(':').map(Number)
    if (!y || !viewDate) {
      toast.error('Bitte Datum wählen')
      return
    }
    const dt = new Date(y, mo - 1, d, hh, mm)
    if (dt.getTime() < Date.now() - 30_000) {
      toast.error('Termin muss in der Zukunft liegen')
      return
    }
    void patch({
      action: 'request_viewing',
      viewingDate: dt.toISOString(),
      viewingNote: viewNote.trim() || undefined,
    })
  }

  const sheetOverlay =
    'fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center'
  const sheetPanel =
    'w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto'

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <header className="border-b border-slate-200 pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#107a5a]">Helvenda Wohnungen</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0d2b1f]">Neue Bewerbung</h1>
        <p className="mt-2 text-sm text-slate-600">{view.listing.title}</p>
        <p className="text-sm text-slate-500">
          {view.listing.addressLine} · CHF {view.listing.rentPerMonth.toLocaleString('de-CH')}.— / Monat
        </p>
      </header>

      {responded && !rejected && !hasViewing ?
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Du hast auf diese Bewerbung geantwortet. Der Bewerber wurde per E-Mail informiert.
        </div>
      : null}

      {hasViewing ?
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Besichtigung angefragt
          {view.viewingDate ?
            ` — ${new Date(view.viewingDate).toLocaleString('de-CH', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : ''}
        </div>
      : null}

      {rejected ?
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
          Diese Bewerbung wurde abgelehnt.
        </div>
      : null}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">{view.applicant.fullName}</h2>
        <p className="mt-1 text-xs text-slate-500">
          Beworben am{' '}
          {new Date(view.createdAt).toLocaleString('de-CH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>

        <div className="mt-4 space-y-2 text-sm text-slate-800">
          {view.applicant.contactPhone ?
            <p>
              <span className="font-medium text-slate-500">Telefon:</span> {view.applicant.contactPhone}
            </p>
          : null}
          {view.applicant.contactEmail ?
            <p>
              <span className="font-medium text-slate-500">E-Mail:</span>{' '}
              <a href={`mailto:${view.applicant.contactEmail}`} className="font-semibold text-teal-800 hover:underline">
                {view.applicant.contactEmail}
              </a>
            </p>
          : null}
          <p>
            <span className="font-medium text-slate-500">Beschäftigung:</span> {empLine}
          </p>
          <p>
            <span className="font-medium text-slate-500">Einkommen:</span> {incomeLine}
          </p>
          {view.applicant.referenceName ?
            <p>
              <span className="font-medium text-slate-500">Referenz:</span> {view.applicant.referenceName}
              {view.applicant.referencePhone ? ` · ${view.applicant.referencePhone}` : ''}
            </p>
          : null}
        </div>

        {view.applicant.summary ?
          <div className="mt-4 rounded-xl border border-teal-100 bg-[#f0faf5] px-4 py-3 text-sm leading-relaxed text-slate-800">
            <p className="font-semibold text-teal-900">Kurzprofil (Helvenda)</p>
            <p className="mt-2 whitespace-pre-wrap">{view.applicant.summary}</p>
          </div>
        : null}

        {view.message?.trim() ?
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-800">Nachricht des Bewerbers</p>
            <p className="mt-2 whitespace-pre-wrap">{view.message}</p>
          </div>
        : null}

        <div className="mt-4">
          <CreditCheckBadge status="approved" creditCheckResult={creditParsed} />
        </div>

        {view.certificateVerifyUrl ?
          <Link
            href={view.certificateVerifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline"
          >
            Qualitätsnachweis prüfen
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        : null}
      </section>

      {!rejected && !hasViewing && !responded ?
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setViewDate(minDate)
              setViewTime('10:00')
              setViewNote('')
              setViewModal(true)
            }}
            className="min-h-[48px] rounded-xl bg-[#18a87c] px-4 py-3 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
          >
            Besichtigung anfragen
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setContactModal(true)}
            className="min-h-[48px] rounded-xl border border-teal-700 bg-white px-4 py-3 text-sm font-semibold text-teal-900 hover:bg-teal-50 disabled:opacity-50"
          >
            Ich melde mich direkt beim Bewerber
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setRejectModal(true)}
            className="min-h-[48px] rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Bewerbung ablehnen
          </button>
        </div>
      : null}

      {busy ?
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Wird gesendet…
        </p>
      : null}

      <p className="mt-10 text-center text-xs text-slate-500">
        Powered by{' '}
        <a href="https://wohnen.helvenda.ch" className="font-semibold text-teal-800 hover:underline">
          Helvenda Wohnungen
        </a>
      </p>

      {viewModal ?
        <div className={sheetOverlay} role="dialog" aria-modal="true">
          <div className={sheetPanel}>
            <h2 className="text-lg font-bold text-slate-900">Besichtigung anfragen</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Datum</label>
                <input
                  type="date"
                  min={minDate}
                  value={viewDate}
                  onChange={e => setViewDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Uhrzeit</label>
                <select
                  value={viewTime}
                  onChange={e => setViewTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {times.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Optionale Notiz</label>
                <textarea
                  value={viewNote}
                  onChange={e => setViewNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="z. B. Treffpunkt"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => setViewModal(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold">
                Abbrechen
              </button>
              <button type="button" onClick={onSubmitViewing} disabled={busy} className="rounded-xl bg-[#18a87c] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                Anfrage senden
              </button>
            </div>
          </div>
        </div>
      : null}

      {contactModal ?
        <div className={sheetOverlay} role="dialog" aria-modal="true">
          <div className={sheetPanel}>
            <h2 className="text-lg font-bold text-slate-900">Direktkontakt bestätigen</h2>
            <p className="mt-2 text-sm text-slate-600">
              Der Bewerber erhält eine E-Mail, dass du dich direkt bei ihm meldest. Telefon und E-Mail stehen oben.
            </p>
            <textarea
              value={contactNote}
              onChange={e => setContactNote(e.target.value)}
              rows={3}
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Optionale Notiz für den Bewerber"
            />
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => setContactModal(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold">
                Abbrechen
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void patch({
                    action: 'contact_directly',
                    directContactNote: contactNote.trim() || undefined,
                  })
                }
                className="rounded-xl bg-[#18a87c] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Bestätigen
              </button>
            </div>
          </div>
        </div>
      : null}

      {rejectModal ?
        <div className={sheetOverlay} role="dialog" aria-modal="true">
          <div className={sheetPanel}>
            <CheckCircle2 className="hidden" aria-hidden />
            <h2 className="text-lg font-bold text-slate-900">Bewerbung ablehnen</h2>
            <p className="mt-3 text-sm text-slate-600">
              Der Bewerber wird per E-Mail informiert, dass die Bewerbung nicht weiterverfolgt wird.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={() => setRejectModal(false)} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold">
                Abbrechen
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void patch({ action: 'reject' })}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
              >
                Ablehnen
              </button>
            </div>
          </div>
        </div>
      : null}
    </main>
  )
}
