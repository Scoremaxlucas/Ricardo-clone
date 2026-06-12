'use client'

import { CertificateProfilSection } from '@/app/profil/CertificateProfilSection'
import { OnboardingCompleteOverlay } from '@/app/profil/OnboardingCompleteOverlay'
import { ProfilBonusSettings } from '@/components/wohnen/ProfilBonusSettings'
import type { CreditCheckResult } from '@/lib/rental/types'
import { formatDate } from '@/lib/utils/formatDate'
import type { CreditCheckStatus } from '@prisma/client'
import { AlertTriangle, Check, Search } from 'lucide-react'
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
  certificate: {
    active: { certificateCode: string; expiresAt: string } | null
    eligible: boolean
    checklist: { profileComplete: boolean; creditOk: boolean }
  }
  bonusPayoutIban: string | null
  listingMatchAlertsEnabled: boolean
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
  certificate,
  bonusPayoutIban,
  listingMatchAlertsEnabled,
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
              {preferenceRows.length ? 'Suche anpassen' : 'Suche einrichten'}
            </Link>
          </div>
        </header>

        <CertificateProfilSection
          activeCertificate={certificate.active}
          eligible={certificate.eligible}
          checklist={certificate.checklist}
          firstName={firstName}
        />

        <div className="mt-8 flex flex-wrap gap-2">
          {isComplete ?
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f7f2] px-[14px] py-1.5 text-xs font-semibold text-[#107a5a]">
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              Profil vollständig
            </span>
          : null}
          {approvedValid ?
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f7f2] px-[14px] py-1.5 text-xs font-semibold text-[#107a5a]">
              <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              Betreibungsregister gültig
            </span>
          : null}
          {needsRegisterUpload ?
            <Link
              href="/profil/betreibungsregister"
              className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-[14px] py-1.5 text-xs font-semibold text-orange-900 hover:bg-orange-100"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
              Betreibungsregister hochladen
            </Link>
          : null}
          {pendingReview ?
            <span className="rounded-full bg-slate-100 px-[14px] py-1.5 text-xs font-semibold text-slate-600">
              Wird geprüft…
            </span>
          : null}
        </div>

        {preferenceRows.length === 0 ?
          <section className="mt-10 rounded-2xl border border-[#b2e8d8] bg-[#f5fdfb] p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f2] text-[#107a5a]">
                <Search className="h-5 w-5" strokeWidth={2} aria-hidden />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0d2b1f]">Wohnungssuche einrichten</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#5a7a6e]">
                  Ort, Budget und Zimmer. Damit wir dir passende Inserate unter Meine Matches zeigen.
                </p>
              </div>
            </div>
            <Link
              href="/profil/suche"
              className="mt-5 inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-[#18a87c] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 sm:mt-0"
            >
              Suche einrichten
            </Link>
          </section>
        : null}

        <div
          className={`mt-14 grid gap-14 ${preferenceRows.length ? 'min-[900px]:grid-cols-2' : 'max-w-2xl'}`}
        >
          <section>
            <h2 className="text-sm font-semibold text-[#0d2b1f]">Persönliche Angaben</h2>
            <div className="mt-5 flex flex-col gap-5">
              {personalRows.map(row => (
                <div key={row.key}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8aa89e]">{row.label}</p>
                  <p className="mt-1 whitespace-pre-line text-[15px] font-medium text-[#0d2b1f]">{row.value}</p>
                </div>
              ))}
            </div>
          </section>
          {preferenceRows.length ?
            <section>
              <h2 className="text-sm font-semibold text-[#0d2b1f]">Suchpräferenzen</h2>
              <div className="mt-5 flex flex-col gap-5">
                {preferenceRows.map(row => (
                  <div key={row.key}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8aa89e]">{row.label}</p>
                    <p className="mt-1 text-[15px] font-medium text-[#0d2b1f]">{row.value}</p>
                  </div>
                ))}
                <Link
                  href="/profil/suche"
                  className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[#18a87c] hover:underline"
                >
                  Suche anpassen
                </Link>
              </div>
            </section>
          : null}
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
                Neuen Auszug hochladen
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
                Jetzt hochladen
              </Link>
            </div>
          : null}
          {pendingReview && !approvedValid ?
            <div className="mt-3 rounded-xl border-l-[3px] border-l-slate-300 bg-slate-50 px-5 py-4">
              <p className="text-[15px] font-medium text-[#0d2b1f]">Wird geprüft — wir melden uns kurz.</p>
            </div>
          : null}
        </div>

        <div className="mt-14">
          <ProfilBonusSettings
            initialIban={bonusPayoutIban}
            initialAlertsEnabled={listingMatchAlertsEnabled}
          />
        </div>
      </main>
    </>
  )
}
