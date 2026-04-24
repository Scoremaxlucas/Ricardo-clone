'use client'

import { CreditCheckBadge } from '@/components/rental/CreditCheckBadge'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import { employmentSummaryDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import { Building2, CheckCircle2, Lock, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { wohnenToast } from '@/lib/wohnen-toast'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

export type BewerbenListingPreview = {
  id: string
  title: string
  address: string
  zip: string
  city: string
  rooms: number
  areaSqm: number
  rentPerMonth: number
  firstPhotoUrl: string | null
}

export type BewerbenTenantPreview = {
  firstName: string
  lastName: string
  employmentStatus: import('@prisma/client').EmploymentStatus
  employer: string | null
  jobTitle: string | null
  employedSince: string | null
  monthlyIncomeCategory: import('@prisma/client').IncomeCategory
  householdTotalPersons: number
  householdChildrenCount: number
  referenceName: string | null
  referenceRelation: string | null
  creditCheckStatus: import('@prisma/client').CreditCheckStatus
  creditCheckResult: unknown
}

type Props = {
  listing: BewerbenListingPreview
  tenant: BewerbenTenantPreview
  requiresCreditCheck: boolean
}

export function BewerbenClient({ listing, tenant, requiresCreditCheck }: Props) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const creditResult = useMemo((): CreditCheckResult | null => {
    const r = tenant.creditCheckResult
    if (!r || typeof r !== 'object') return null
    return isCreditCheckResult(r) ? r : null
  }, [tenant.creditCheckResult])

  const empText = useMemo(
    () =>
      employmentSummaryDe(
        tenant.employmentStatus,
        tenant.employer,
        tenant.jobTitle,
        tenant.employedSince ? new Date(tenant.employedSince) : null
      ),
    [tenant]
  )

  const incomeText = incomeCategoryLabelDe(tenant.monthlyIncomeCategory)

  const submit = async () => {
    setError(null)
    if (requiresCreditCheck && !confirm) {
      setError('Bitte bestätige die Checkbox.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/rental-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rentalListingId: listing.id,
          message: message.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.code === 'ALREADY_APPLIED') {
          wohnenToast.alreadyApplied()
          router.replace('/meine-bewerbungen?already=true')
          return
        }
        setError(typeof data.message === 'string' ? data.message : 'Senden fehlgeschlagen')
        return
      }
      wohnenToast.applicationSuccess()
      setDone(true)
    } catch {
      wohnenToast.genericError()
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="mx-auto max-w-lg py-16 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pt-[max(3rem,calc(2rem+env(safe-area-inset-top,0px)))] text-center sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))]">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50/90 px-5 py-10 shadow-sm sm:px-6 sm:py-12">
          <CheckCircle2 className="h-16 w-16 text-emerald-600" aria-hidden />
          <h1 className="mt-6 text-xl font-bold leading-tight text-emerald-950 sm:text-2xl">Bewerbung erfolgreich abgeschickt</h1>
          <p className="mt-4 text-sm leading-relaxed text-emerald-900">
            Der Vermieter wurde benachrichtigt und wird sich bei dir melden. Du kannst deine Bewerbungen jederzeit unter
            &quot;Meine Bewerbungen&quot; einsehen.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/meine-bewerbungen"
              className="inline-flex flex-1 justify-center rounded-xl bg-[#18a87c] px-4 py-3 text-sm font-semibold text-white shadow-md sm:flex-none"
            >
              Meine Bewerbungen ansehen
            </Link>
            <Link
              href="/wohnungen"
              className="inline-flex flex-1 justify-center rounded-xl border border-emerald-800 px-4 py-3 text-sm font-semibold text-emerald-900 sm:flex-none"
            >
              Weitere Wohnungen suchen
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl py-8 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:py-10 sm:pl-6 sm:pr-6">
      <Link href={`/wohnungen/${listing.id}`} className="text-sm font-medium text-teal-800 underline-offset-2 hover:underline">
        ← Zurück zum Inserat
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">Bewerbung</h1>
      <p className="mt-2 text-sm text-slate-600">Prüfe deine Angaben und sende deine Bewerbung mit einem Klick ab.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,40%)] lg:items-start">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex gap-4">
              <div className="h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {listing.firstPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.firstPhotoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-300" aria-hidden>
                    <Building2 className="h-8 w-8 opacity-40" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900">{listing.title}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {listing.address}, {listing.zip} {listing.city}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {listing.rooms} Zi. · {listing.areaSqm} m² · CHF {listing.rentPerMonth.toLocaleString('de-CH')}.— / Monat
                </p>
                <Link href={`/wohnungen/${listing.id}`} className="mt-3 inline-block text-sm font-semibold text-teal-800 underline-offset-2 hover:underline">
                  Zur Inserat-Detailseite →
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-base font-bold text-slate-900">Das sieht der Vermieter von dir:</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-800">
              <p>
                <span className="font-medium text-slate-500">Name:</span> {tenant.firstName} {tenant.lastName}
              </p>
              <p>
                <span className="font-medium text-slate-500">Beruf:</span> {empText}
              </p>
              <p>
                <span className="font-medium text-slate-500">Haushaltsnettoeinkommen (Kategorie):</span> {incomeText}
              </p>
              <p>
                <span className="font-medium text-slate-500">Haushalt:</span> {tenant.householdTotalPersons}{' '}
                {tenant.householdTotalPersons === 1 ? 'Person (allein)' : 'Personen'}, {tenant.householdChildrenCount}{' '}
                Kinder
              </p>
              {requiresCreditCheck && tenant.creditCheckStatus === 'APPROVED' && creditResult ? (
                <div className="pt-2">
                  <CreditCheckBadge status="approved" creditCheckResult={creditResult} />
                </div>
              ) : null}
              {tenant.referenceName?.trim() ? (
                <p>
                  <span className="font-medium text-slate-500">Referenz:</span> {tenant.referenceName}
                  {tenant.referenceRelation?.trim() ? ` · ${tenant.referenceRelation}` : ''}
                </p>
              ) : null}
            </div>
            <Link href="/profil/bearbeiten" className="mt-4 inline-block text-sm font-semibold text-teal-800 underline-offset-2 hover:underline">
              Profil bearbeiten →
            </Link>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Bewerbung abschicken</h2>
            <label className="mt-4 block text-sm font-medium text-slate-700">Nachricht an den Vermieter (optional)</label>
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm"
              rows={4}
              maxLength={500}
              placeholder="Stell dich kurz vor — warum interessiert dich diese Wohnung?"
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <p className="mt-1 text-right text-xs text-slate-500">{message.length} / 500</p>

            {requiresCreditCheck ? (
              <>
                <div className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                  <span>Dein Betreibungsregisterauszug wird automatisch mitgeschickt.</span>
                </div>
                <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    checked={confirm}
                    onChange={e => {
                      setConfirm(e.target.checked)
                      setError(null)
                    }}
                    className="mt-1"
                  />
                  <span>Ich bestätige, dass alle Angaben in meinem Profil korrekt und aktuell sind.</span>
                </label>
              </>
            ) : null}

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <button
              type="button"
              disabled={submitting || (requiresCreditCheck && !confirm)}
              onClick={submit}
              className="mt-5 w-full rounded-xl bg-[#18a87c] py-3.5 text-sm font-bold text-white shadow-md hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Wird gesendet…' : 'Bewerbung absenden'}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
              <Lock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              <span>Deine Bewerbung wird sicher übertragen.</span>
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
