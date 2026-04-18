import { ProfilCreditPanel } from '@/components/wohnen/ProfilCreditPanel'
import { authOptions } from '@/lib/auth'
import { employmentSummaryDe, incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import { prisma } from '@/lib/prisma'
import type { CreditCheckResult } from '@/lib/rental/types'
import { isCreditCheckResult } from '@/lib/rental/types'
import { formatDate } from '@/lib/utils/formatDate'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Mein Profil | Helvenda Wohnungen',
  description: 'Mieterprofil und Betreibungsregister.',
}

function creditResult(row: unknown): CreditCheckResult | null {
  if (!row || typeof row !== 'object') return null
  return isCreditCheckResult(row) ? row : null
}

export default async function ProfilPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/profil'))
  }

  const profile = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (!profile) {
    redirect('/profil/erstellen')
  }

  const empText = employmentSummaryDe(
    profile.employmentStatus,
    profile.employer,
    profile.jobTitle,
    profile.employedSince
  )
  const incomeText = incomeCategoryLabelDe(profile.monthlyIncomeCategory)
  const creditJson = creditResult(profile.creditCheckResult)

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Mein Profil</h1>
      <p className="mt-2 text-sm text-slate-600">Deine Angaben für Bewerbungen auf Helvenda Wohnungen.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,38%)]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Persönliche Angaben</h2>
              <Link
                href="/profil/bearbeiten"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Bearbeiten
              </Link>
            </div>
            <dl className="mt-4 space-y-2 text-sm text-slate-700">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium">
                  {profile.firstName} {profile.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Geburtsdatum</dt>
                <dd className="font-medium">{formatDate(profile.dateOfBirth)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Adresse</dt>
                <dd className="font-medium">
                  {profile.currentAddress}, {profile.currentZip} {profile.currentCity}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">Beschäftigung &amp; Einkommen</h2>
              <Link
                href="/profil/bearbeiten"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Bearbeiten
              </Link>
            </div>
            <p className="mt-4 text-sm text-slate-800">{empText}</p>
            <p className="mt-2 text-sm text-slate-600">Einkommen (Kategorie): {incomeText}</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Referenz</h2>
            {profile.referenceName?.trim() ? (
              <p className="mt-4 text-sm text-slate-800">
                {profile.referenceName}
                {profile.referenceRelation?.trim() ? ` · ${profile.referenceRelation}` : ''}
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-600">
                Keine Referenz hinterlegt —{' '}
                <Link href="/profil/bearbeiten" className="font-semibold text-teal-800 underline-offset-2 hover:underline">
                  Jetzt hinzufügen
                </Link>
              </p>
            )}
          </section>
        </div>

        <div>
          <ProfilCreditPanel
            creditCheckStatus={profile.creditCheckStatus}
            creditCheckResult={creditJson}
            creditCheckExpiresAt={profile.creditCheckExpiresAt}
          />
        </div>
      </div>
    </main>
  )
}
