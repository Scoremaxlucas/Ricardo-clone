'use client'

import { CreditCheckBadge } from '@/components/rental/CreditCheckBadge'
import { WohnenEmptyState } from '@/components/wohnen/WohnenEmptyState'
import type { RentalApplicationBadgeStatus } from '@/components/rental/CreditCheckBadge'
import { employmentSummaryDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import type { EmploymentStatus, IncomeCategory, RentalApplicationStatus } from '@prisma/client'
import { wohnenToast } from '@/lib/wohnen-toast'
import { Inbox, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

export type LandlordApplicationRow = {
  id: string
  createdAt: string
  status: RentalApplicationStatus
  message: string | null
  rejectedAt: string | null
  viewingRequestedAt: string | null
  viewingDate: string | null
  creditCheckResult: unknown
  tenant: {
    firstName: string
    lastName: string
    employmentStatus: EmploymentStatus
    employer: string | null
    jobTitle: string | null
    employedSince: string | null
    monthlyIncomeCategory: IncomeCategory
    referenceName: string | null
  } | null
}

type ListingHead = {
  id: string
  title: string
  addressLine: string
  rentPerMonth: number
  thumbUrl: string | null
}

type Tab = 'all' | 'neu' | 'viewing' | 'rejected'

type Props = {
  listing: ListingHead
  applications: LandlordApplicationRow[]
}

function initials(first: string, last: string) {
  const a = first.trim().charAt(0)
  const b = last.trim().charAt(0)
  return (a + b).toUpperCase() || '?'
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

function tabLabel(t: Tab): string {
  switch (t) {
    case 'all':
      return 'Alle'
    case 'neu':
      return 'Neu'
    case 'viewing':
      return 'Besichtigung angefragt'
    case 'rejected':
      return 'Abgelehnt'
  }
}

function matchesTab(row: LandlordApplicationRow, tab: Tab): boolean {
  const rejected = row.status === 'rejected' || row.rejectedAt != null
  const hasViewing = row.viewingRequestedAt != null
  const neu = row.status === 'approved' && !rejected && !hasViewing
  if (tab === 'all') return true
  if (tab === 'neu') return neu
  if (tab === 'viewing') return hasViewing && !rejected
  if (tab === 'rejected') return rejected
  return true
}

function badgeStatus(row: LandlordApplicationRow): RentalApplicationBadgeStatus {
  if (
    row.status === 'pending_credit_check' ||
    row.status === 'pending_manual_review' ||
    row.status === 'approved' ||
    row.status === 'rejected'
  ) {
    return row.status
  }
  return 'approved'
}

function LandlordApplicationCard({
  row,
  busyId,
  onOpenView,
  onOpenReject,
}: {
  row: LandlordApplicationRow
  busyId: string | null
  onOpenView: (r: LandlordApplicationRow) => void
  onOpenReject: (r: LandlordApplicationRow) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const rejected = row.status === 'rejected' || row.rejectedAt != null
  const hasViewing = row.viewingRequestedAt != null
  const t = row.tenant
  const name = t ? `${t.firstName} ${t.lastName}`.trim() : 'Mieter'
  const emp =
    t ?
      employmentSummaryDe(
        t.employmentStatus,
        t.employer,
        t.jobTitle,
        t.employedSince ? new Date(t.employedSince) : null
      )
    : '—'
  const income = t ? `${incomeCategoryLabelDe(t.monthlyIncomeCategory)} / Monat` : '—'
  const hasRef = Boolean(t?.referenceName?.trim())
  const creditParsed: CreditCheckResult | null = isCreditCheckResult(row.creditCheckResult) ? row.creditCheckResult : null
  const msg = row.message?.trim() || ''

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-stretch">
      <div className="flex min-w-0 flex-1 gap-3 lg:max-w-[280px]">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-900">
          {t ? initials(t.firstName, t.lastName) : '?'}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">
            Beworben am{' '}
            {new Date(row.createdAt).toLocaleString('de-CH', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          {msg ?
            <div className="mt-2 text-sm text-slate-700">
              {msg.length > 100 && !expanded ?
                <>
                  {msg.slice(0, 100)}…{' '}
                  <button type="button" className="font-semibold text-teal-800" onClick={() => setExpanded(true)}>
                    Mehr anzeigen
                  </button>
                </>
              : <span className="whitespace-pre-wrap">{msg}</span>}
            </div>
          : null}
        </div>
      </div>

      <div className="min-w-0 flex-1 border-t border-slate-100 pt-4 text-sm lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <p className="text-slate-800">{emp}</p>
        <p className="mt-1 text-slate-700">{income}</p>
        <p className={`mt-2 text-sm ${hasRef ? 'font-medium text-teal-900' : 'text-slate-500'}`}>
          {hasRef ? '✓ Referenz vorhanden' : 'Keine Referenz'}
        </p>
        <div className="mt-3">
          <CreditCheckBadge status={badgeStatus(row)} creditCheckResult={creditParsed} />
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-slate-100 pt-4 lg:w-52 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        {hasViewing ?
          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">
            📅 Besichtigung angefragt
          </span>
        : null}
        {rejected ?
          <span className="inline-flex rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
            Abgelehnt
          </span>
        : null}
        <button
          type="button"
          disabled={Boolean(busyId) || rejected || hasViewing}
          onClick={() => onOpenView(row)}
          className="min-h-[48px] w-full rounded-xl bg-[#18a87c] px-3 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
        >
          Besichtigung anfragen
        </button>
        <button
          type="button"
          disabled={Boolean(busyId) || rejected || hasViewing}
          onClick={() => onOpenReject(row)}
          className="min-h-[48px] w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
        >
          Ablehnen
        </button>
        {busyId === row.id ?
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          </span>
        : null}
      </div>
    </li>
  )
}

export function LandlordListingApplicationsClient({ listing, applications: initialApps }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('all')
  const [rows, setRows] = useState(initialApps)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [viewModal, setViewModal] = useState<LandlordApplicationRow | null>(null)
  const [rejectModal, setRejectModal] = useState<LandlordApplicationRow | null>(null)
  const [viewDate, setViewDate] = useState('')
  const [viewTime, setViewTime] = useState('10:00')
  const [viewNote, setViewNote] = useState('')

  useEffect(() => {
    setRows(initialApps)
  }, [initialApps])

  const filtered = useMemo(() => rows.filter(r => matchesTab(r, tab)), [rows, tab])
  const times = useMemo(() => timeOptions(), [])

  const minDate = useMemo(() => {
    const t = new Date()
    return t.toISOString().slice(0, 10)
  }, [])

  const patchApp = useCallback(
    async (id: string, body: Record<string, unknown>, optimistic: (r: LandlordApplicationRow) => LandlordApplicationRow) => {
      setBusyId(id)
      const prev = rows
      setRows(cur => cur.map(r => (r.id === id ? optimistic(r) : r)))
      try {
        const res = await fetch(`/api/rental-applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setRows(prev)
          toast.error((data as { message?: string }).message || 'Aktion fehlgeschlagen')
          return
        }
        const app = (data as { application?: { status: string; viewingDate: string | null; viewingRequestedAt: string | null; rejectedAt: string | null } }).application
        if (app) {
          setRows(cur =>
            cur.map(r =>
              r.id === id ?
                {
                  ...r,
                  status: app.status as RentalApplicationStatus,
                  viewingDate: app.viewingDate,
                  viewingRequestedAt: app.viewingRequestedAt,
                  rejectedAt: app.rejectedAt,
                }
              : r
            )
          )
        }
        if (body.action === 'request_viewing') {
          wohnenToast.viewingRequested()
        } else if (body.action === 'reject') {
          wohnenToast.applicationRejected()
        } else {
          toast.success('Gespeichert')
        }
        router.refresh()
      } catch {
        setRows(prev)
        wohnenToast.genericError()
      } finally {
        setBusyId(null)
        setViewModal(null)
        setRejectModal(null)
      }
    },
    [rows, router]
  )

  const onSubmitViewing = () => {
    if (!viewModal) return
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
    void patchApp(
      viewModal.id,
      { action: 'request_viewing', viewingDate: dt.toISOString(), viewingNote: viewNote.trim() || undefined },
      r => ({
        ...r,
        viewingRequestedAt: new Date().toISOString(),
        viewingDate: dt.toISOString(),
      })
    )
  }

  const onConfirmReject = () => {
    if (!rejectModal) return
    void patchApp(
      rejectModal.id,
      { action: 'reject' },
      r => ({
        ...r,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
      })
    )
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10 lg:px-6">
      <Link href="/matching/properties" className="text-sm font-medium text-teal-800 hover:underline">
        ← Zurück zu meinen Inseraten
      </Link>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          {listing.thumbUrl ?
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.thumbUrl} alt="" className="h-full w-full object-cover" />
          : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">{listing.title}</p>
          <p className="text-sm text-slate-600">{listing.addressLine}</p>
          <p className="text-sm font-medium text-slate-800">
            CHF {listing.rentPerMonth.toLocaleString('de-CH')} / Monat
          </p>
        </div>
      </div>

      <h1 className="mt-8 text-2xl font-bold text-slate-900">Bewerbungen ({rows.length})</h1>

      {rows.length === 0 ?
        <div className="mt-10">
          <WohnenEmptyState
            icon={Inbox}
            title="Noch keine Bewerbungen für dieses Inserat"
            description="Sobald sich Mieter bewerben, erscheinen sie hier."
          />
        </div>
      : (
        <>
          <div className="mt-4 flex flex-wrap gap-1 border-b border-slate-200">
            {(['all', 'neu', 'viewing', 'rejected'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`min-h-[44px] border-b-2 px-3 py-2 text-sm font-semibold transition ${
                  tab === t ? 'border-[#18a87c] text-teal-900' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {tabLabel(t)}
              </button>
            ))}
          </div>

          <ul className="mt-6 space-y-4">
            {filtered.length === 0 ?
              <li className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-sm text-slate-600">
                Keine Bewerbungen in dieser Ansicht.
              </li>
            : null}
            {filtered.map(row => (
          <LandlordApplicationCard
            key={row.id}
            row={row}
            busyId={busyId}
            onOpenView={r => {
              setViewDate(minDate)
              setViewTime('10:00')
              setViewNote('')
              setViewModal(r)
            }}
            onOpenReject={setRejectModal}
          />
            ))}
          </ul>
        </>
      )}

      {viewModal ?
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="wohnen-bottom-sheet-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-[20px] bg-white px-5 pb-6 pt-2 shadow-xl sm:rounded-2xl sm:px-6 sm:pt-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e0e0e0] sm:hidden" aria-hidden />
            <h2 className="text-lg font-bold text-slate-900">Besichtigung anfragen</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Datum</label>
                <input
                  type="date"
                  min={minDate}
                  value={viewDate}
                  onChange={e => setViewDate(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base sm:min-h-0 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Uhrzeit</label>
                <select
                  value={viewTime}
                  onChange={e => setViewTime(e.target.value)}
                  className="mt-1 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base sm:min-h-0 sm:text-sm"
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
                  placeholder="z. B. Treffpunkt"
                  className="mt-1 min-h-[48px] w-full rounded-lg border border-slate-300 px-3 py-2 text-base sm:min-h-0 sm:text-sm"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setViewModal(null)}
                className="min-h-[44px] w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 sm:w-auto"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={onSubmitViewing}
                disabled={Boolean(busyId)}
                className="min-h-[44px] w-full rounded-xl bg-[#18a87c] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 sm:w-auto"
              >
                Anfrage senden
              </button>
            </div>
          </div>
        </div>
      : null}

      {rejectModal ?
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="wohnen-bottom-sheet-panel w-full max-w-md rounded-t-[20px] bg-white px-5 pb-6 pt-2 shadow-xl sm:rounded-2xl sm:px-6 sm:pt-6">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e0e0e0] sm:hidden" aria-hidden />
            <h2 className="text-lg font-bold text-slate-900">Bewerbung ablehnen</h2>
            <p className="mt-3 text-sm text-slate-600">
              Der Bewerber wird nicht benachrichtigt — die Ablehnung ist nur intern sichtbar.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="min-h-[44px] w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 sm:w-auto"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={onConfirmReject}
                disabled={Boolean(busyId)}
                className="min-h-[44px] w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 sm:w-auto"
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
