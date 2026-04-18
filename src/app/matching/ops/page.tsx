import { authOptions } from '@/lib/auth'
import { requireMatchingAdmin } from '@/lib/matching/matching-ops-auth'
import { prisma } from '@/lib/prisma'
import { DocumentVerificationStatus, MatchingApplicationStatus } from '@prisma/client'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Ops',
  description: 'Helvenda Matching — Ops-Übersicht.',
}

export default async function MatchingOpsHubPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/ops'))
  }

  const gate = await requireMatchingAdmin()
  if (!gate.ok) redirect('/matching')

  const [pendingDocs, submittedApps] = await Promise.all([
    prisma.documentVerification.count({
      where: { status: DocumentVerificationStatus.pending },
    }),
    prisma.matchingApplication.count({
      where: {
        status: {
          in: [
            MatchingApplicationStatus.submitted,
            MatchingApplicationStatus.landlord_reviewing,
          ],
        },
      },
    }),
  ])

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Ops / Admin</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Matching Ops</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Warteschlangen und Audit-Log für interne Abläufe. Nur für Helvenda-Admins sichtbar.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/matching/ops/documents"
          className="rounded-xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm transition hover:border-amber-300 hover:shadow"
        >
          <h2 className="text-lg font-semibold text-amber-950">Dokumente</h2>
          <p className="mt-2 text-3xl font-bold text-amber-900">{pendingDocs}</p>
          <p className="mt-1 text-sm text-amber-900/80">Ausstehende Nachweise prüfen</p>
        </Link>

        <Link
          href="/matching/ops/applications"
          className="rounded-xl border border-teal-200 bg-teal-50/90 p-5 shadow-sm transition hover:border-teal-300 hover:shadow"
        >
          <h2 className="text-lg font-semibold text-teal-950">Bewerbungen</h2>
          <p className="mt-2 text-3xl font-bold text-teal-900">{submittedApps}</p>
          <p className="mt-1 text-sm text-teal-900/80">Eingereicht / in Prüfung</p>
        </Link>

        <Link
          href="/matching/ops/audit"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow sm:col-span-2 lg:col-span-1"
        >
          <h2 className="text-lg font-semibold text-slate-900">Audit-Suche</h2>
          <p className="mt-2 text-sm text-slate-600">
            Ereignisse zu Bewerbungen, Consent, Dokumenten und Verifikation filtern.
          </p>
        </Link>
      </div>

      <p className="mt-12 text-sm text-slate-500">
        <Link href="/matching" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Zurück zum Matching
        </Link>
      </p>
    </main>
  )
}
