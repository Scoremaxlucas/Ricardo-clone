'use client'

import { ProfilCreditPanel } from '@/components/wohnen/ProfilCreditPanel'
import type { CreditCheckResult } from '@/lib/rental/types'
import type { CreditCheckStatus } from '@prisma/client'
import Link from 'next/link'
import { OnboardingCompleteOverlay } from '@/app/profil/OnboardingCompleteOverlay'

export type ProfilDashboardProps = {
  showOnboardingComplete: boolean
  firstName: string
  lastName: string
  employmentLine: string
  creditCheckStatus: CreditCheckStatus
  creditCheckResult: CreditCheckResult | null
  creditCheckExpiresAt: string | null
  isComplete: boolean
  preferredCantonShort: string | null
  personalRows: { key: string; label: string; value: string }[]
  preferenceRows: { key: string; label: string; value: string }[]
}

export function ProfilDashboard({
  showOnboardingComplete,
  firstName,
  lastName,
  employmentLine,
  creditCheckStatus,
  creditCheckResult,
  creditCheckExpiresAt,
  isComplete,
  preferredCantonShort,
  personalRows,
  preferenceRows,
}: ProfilDashboardProps) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?'
  const creditMissing = creditCheckStatus === 'NONE' || creditCheckStatus === 'EXPIRED'

  return (
    <>
      {showOnboardingComplete ? <OnboardingCompleteOverlay /> : null}
      <main className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        <header className="flex flex-col gap-8 border-b border-[#f0f0f0] pb-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-5">
            <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#18a87c] text-xl font-extrabold text-white">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-[#0d2b1f] sm:text-[24px]">
                {firstName} {lastName}
              </h1>
              <p className="mt-2 text-sm text-[#8aa89e]">{employmentLine}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/profil/bearbeiten"
              className="flex h-10 min-h-[40px] min-w-[140px] items-center justify-center rounded-[10px] border-2 border-[#18a87c] px-4 text-sm font-semibold text-[#18a87c]"
            >
              Profil bearbeiten
            </Link>
            <Link
              href="/profil/suche"
              className="flex h-10 min-h-[40px] min-w-[140px] items-center justify-center rounded-[10px] border-2 border-[#18a87c] px-4 text-sm font-semibold text-[#18a87c]"
            >
              Suche anpassen
            </Link>
          </div>
        </header>

        <div className="mt-8 flex flex-wrap gap-2">
          <span
            className={`rounded-full px-[14px] py-1.5 text-xs font-semibold ${
              isComplete ? 'bg-[#e8f7f2] text-[#107a5a]' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isComplete ? 'Profil vollständig' : 'Profil unvollständig'}
          </span>
          {creditMissing ?
            <Link
              href="/profil/betreibungsregister"
              className="rounded-full bg-orange-50 px-[14px] py-1.5 text-xs font-semibold text-orange-900 hover:bg-orange-100"
            >
              Betreibungsregister fehlt
            </Link>
          : (
            <span className="rounded-full bg-[#e8f7f2] px-[14px] py-1.5 text-xs font-semibold text-[#107a5a]">
              Betreibungsregister vorhanden
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-[14px] py-1.5 text-xs font-semibold text-slate-600">
            {preferredCantonShort ? `Kanton ${preferredCantonShort}` : 'Kanton offen'}
          </span>
        </div>

        <div className="mt-14 grid gap-14 min-[900px]:grid-cols-2">
          <section>
            <h2 className="sr-only">Persönliche Daten</h2>
            <div className="flex flex-col gap-5">
              {personalRows.map(row => (
                <div key={row.key}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8aa89e]">{row.label}</p>
                  <p className="mt-1 text-[15px] font-medium text-[#0d2b1f]">{row.value}</p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="sr-only">Suchpräferenzen</h2>
            <div className="flex flex-col gap-5">
              {preferenceRows.length ?
                preferenceRows.map(row => (
                  <div key={row.key}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8aa89e]">{row.label}</p>
                    <p className="mt-1 text-[15px] font-medium text-[#0d2b1f]">{row.value}</p>
                  </div>
                ))
              : <p className="text-[15px] text-[#8aa89e]">Noch keine Suchpräferenzen — in «Suche anpassen» festlegen.</p>}
            </div>
          </section>
        </div>

        <div className="mt-16">
          <ProfilCreditPanel
            creditCheckStatus={creditCheckStatus}
            creditCheckResult={creditCheckResult}
            creditCheckExpiresAt={creditCheckExpiresAt ? new Date(creditCheckExpiresAt) : null}
          />
        </div>
      </main>
    </>
  )
}
