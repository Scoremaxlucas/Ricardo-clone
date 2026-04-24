'use client'

import { OnboardingCompleteOverlay } from '@/app/profil/OnboardingCompleteOverlay'
import type { CreditCheckResult } from '@/lib/rental/types'
import { formatDate } from '@/lib/utils/formatDate'
import type { CreditCheckStatus } from '@prisma/client'
import Link from 'next/link'

export type ProfilDashboardProps = {
  showOnboardingComplete: boolean
  firstName: string
  lastName: string
  employmentLine: string
  creditCheckStatus: CreditCheckStatus
  creditCheckResult: CreditCheckResult | null
  creditCheckExpiresAt: string | null
  isComplete: boolean
  personalRows: { key: string; label: string; value: string }[]
  preferenceRows: { key: string; label: string; value: string }[]
}

function creditApprovedValid(status: CreditCheckStatus, expiresAt: string | null): boolean {
  if (status !== 'APPROVED') return false
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() > Date.now()
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
  personalRows,
  preferenceRows,
}: ProfilDashboardProps) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?'
  const approvedValid = creditApprovedValid(creditCheckStatus, creditCheckExpiresAt)
  const needsRegisterUpload =
    creditCheckStatus === 'NONE' ||
    creditCheckStatus === 'EXPIRED' ||
    creditCheckStatus === 'REJECTED' ||
    (creditCheckStatus === 'APPROVED' && !approvedValid)
  const pendingReview =
    creditCheckStatus === 'PENDING' || creditCheckStatus === 'PENDING_MANUAL_REVIEW'

  return (
    <>
      {showOnboardingComplete ? <OnboardingCompleteOverlay /> : null}
      <main className="mx-auto max-w-4xl py-12 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:px-6 sm:py-16">
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
          {isComplete ?
            <span className="rounded-full bg-[#e8f7f2] px-[14px] py-1.5 text-xs font-semibold text-[#107a5a]">
              ✓ Profil vollständig
            </span>
          : null}
          {approvedValid ?
            <span className="rounded-full bg-[#e8f7f2] px-[14px] py-1.5 text-xs font-semibold text-[#107a5a]">
              ✓ Betreibungsregister gültig
            </span>
          : null}
          {needsRegisterUpload ?
            <Link
              href="/profil/betreibungsregister"
              className="rounded-full bg-orange-50 px-[14px] py-1.5 text-xs font-semibold text-orange-900 hover:bg-orange-100"
            >
              ⚠️ Betreibungsregister hochladen
            </Link>
          : null}
          {pendingReview ?
            <span className="rounded-full bg-slate-100 px-[14px] py-1.5 text-xs font-semibold text-slate-600">
              Wird geprüft…
            </span>
          : null}
        </div>

        <div className="mt-14 grid gap-14 min-[900px]:grid-cols-2">
          <section>
            <h2 className="sr-only">Persönliche Daten</h2>
            <div className="flex flex-col gap-5">
              {personalRows.map(row => (
                <div key={row.key}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8aa89e]">{row.label}</p>
                  <p className="mt-1 whitespace-pre-line text-[15px] font-medium text-[#0d2b1f]">{row.value}</p>
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
              : (
                <div className="rounded-xl border-[1.5px] border-[#b2e8d8] bg-[#f5fdfb] p-5">
                  <p className="text-[15px] font-medium leading-relaxed text-[#0d2b1f]">
                    Deine Suche ist noch nicht eingerichtet.
                  </p>
                  <Link
                    href="/profil/suche"
                    className="mt-4 inline-flex min-h-[44px] items-center text-[15px] font-semibold text-[#18a87c] hover:underline"
                  >
                    Suche einrichten →
                  </Link>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="mt-14">
          <h2 className="text-sm font-semibold text-[#0d2b1f]">Betreibungsregister</h2>
          {approvedValid && creditCheckResult ?
            <div className="mt-3 rounded-xl border-l-[3px] border-l-[#18a87c] bg-[#f5fdfb] px-5 py-4">
              <p className="text-[15px] font-medium text-[#0d2b1f]">
                Verifiziert — gültig bis {creditCheckExpiresAt ? formatDate(new Date(creditCheckExpiresAt)) : '—'}
              </p>
              <Link
                href="/profil/betreibungsregister"
                className="mt-3 inline-flex min-h-[44px] text-[13px] font-semibold text-[#107a5a] hover:underline"
              >
                Neuen Auszug hochladen →
              </Link>
            </div>
          : null}
          {needsRegisterUpload ?
            <div className="mt-3 rounded-xl border-l-[3px] border-l-orange-400 bg-[#fffbeb] px-5 py-4">
              <p className="text-[15px] font-medium leading-relaxed text-[#0d2b1f]">
                {creditCheckStatus === 'REJECTED' ?
                  'Der Auszug konnte nicht akzeptiert werden — bitte lade einen gültigen Schweizer Betreibungsregisterauszug hoch.'
                : creditCheckStatus === 'NONE' ?
                  'Noch nicht hochgeladen — viele Vermieter setzen ihn voraus.'
                : 'Dein Betreibungsregister ist nicht mehr gültig — bitte lade einen aktuellen Auszug hoch.'}
              </p>
              <Link
                href="/profil/betreibungsregister"
                className="mt-3 inline-flex min-h-[44px] text-[14px] font-semibold text-[#c2410c] hover:underline"
              >
                Jetzt hochladen →
              </Link>
            </div>
          : null}
          {pendingReview && !approvedValid ?
            <div className="mt-3 rounded-xl border-l-[3px] border-l-slate-300 bg-slate-50 px-5 py-4">
              <p className="text-[15px] font-medium text-[#0d2b1f]">Wird geprüft — wir melden uns kurz.</p>
            </div>
          : null}
        </div>
      </main>
    </>
  )
}
