import { AdminCreditCheckActions } from '@/components/admin/AdminCreditCheckActions'
import { authOptions } from '@/lib/auth'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import { formatDate } from '@/lib/utils/formatDate'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'User-Details',
  robots: { index: false, follow: false },
}

function badge(status: string) {
  switch (status) {
    case 'NONE':
      return 'bg-slate-100 text-slate-700'
    case 'PENDING':
      return 'bg-amber-100 text-amber-900'
    case 'PENDING_MANUAL_REVIEW':
      return 'bg-orange-100 text-orange-900'
    case 'APPROVED':
      return 'bg-emerald-100 text-emerald-900'
    case 'EXPIRED':
    case 'REJECTED':
      return 'bg-rose-100 text-rose-900'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!(await isAdmin(session))) throwAdminForbidden()

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      tenantProfile: true,
      rentalApplicationsAsApplicant: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          listing: { select: { id: true, title: true, address: true, city: true } },
        },
      },
    },
  })
  if (!user) return notFound()

  const p = user.tenantProfile
  const c = (p?.creditCheckResult as Record<string, unknown> | null) || null
  const fullName = user.name || [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() || '—'

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <Link href="/admin/users" className="text-sm font-semibold text-teal-700 hover:underline">
          ← Zurück zur User-Verwaltung
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">{fullName}</h1>
        <p className="text-slate-600">{user.email}</p>
        <p className="text-xs text-slate-500">Registriert am {formatDate(user.createdAt)}</p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Bereich A — Persönliche Daten</h2>
        {!p ? (
          <p className="mt-3 text-sm text-slate-600">Kein Mieter-Profil vorhanden.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p><strong>Vorname:</strong> {p.firstName || '—'}</p>
            <p><strong>Nachname:</strong> {p.lastName || '—'}</p>
            <p><strong>Geburtsdatum:</strong> {formatDate(p.dateOfBirth)}</p>
            <p><strong>Adresse:</strong> {p.currentAddress || '—'}</p>
            <p><strong>Beschäftigungsstatus:</strong> {p.employmentStatus}</p>
            <p><strong>Arbeitgeber:</strong> {p.employer || '—'}</p>
            <p><strong>Berufsbezeichnung:</strong> {p.jobTitle || '—'}</p>
            <p><strong>Einkommenskategorie:</strong> {incomeCategoryLabelDe(p.monthlyIncomeCategory)}</p>
            <p><strong>Referenz:</strong> {p.referenceName ? `${p.referenceName} (${p.referenceRelation || '—'})` : '—'}</p>
          </div>
        )}
        <div className="mt-4">
          <Link href={`/profil/erstellen?adminEditUserId=${user.id}`} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
            Profil bearbeiten (Admin)
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Bereich B — Betreibungsregister</h2>
        {!p ? (
          <p className="mt-3 text-sm text-slate-600">Kein Profil vorhanden.</p>
        ) : (
          <>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <p>
                <strong>Status:</strong>{' '}
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badge(p.creditCheckStatus)}`}>
                  {p.creditCheckStatus}
                </span>
              </p>
              <p><strong>Hochgeladen:</strong> {p.creditCheckUploadedAt ? formatDate(p.creditCheckUploadedAt) : '—'}</p>
              <p><strong>Gültig bis:</strong> {p.creditCheckExpiresAt ? formatDate(p.creditCheckExpiresAt) : '—'}</p>
              <p><strong>Ausgestellt auf:</strong> {String(c?.fullName || '—')}</p>
              <p><strong>Einträge:</strong> {c?.hasEntries === true ? 'Ja' : c?.hasEntries === false ? 'Nein' : '—'}</p>
              <p><strong>Anzahl Einträge:</strong> {String(c?.entryCount ?? '—')}</p>
              <p><strong>Gesamtbetrag-Kategorie:</strong> {String(c?.totalAmountCategory ?? '—')}</p>
              <p><strong>Ausstellungsdatum:</strong> {String(c?.issueDate ?? '—')}</p>
              <p><strong>Kanton:</strong> {String(c?.canton ?? '—')}</p>
            </div>
            <details className="mt-3 rounded-lg border border-slate-200 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">creditCheckResult JSON anzeigen</summary>
              <pre className="mt-2 overflow-x-auto rounded bg-slate-50 p-3 text-xs">{JSON.stringify(c ?? {}, null, 2)}</pre>
            </details>

            <div className="mt-4">
              <AdminCreditCheckActions
                userId={user.id}
                currentStatus={p.creditCheckStatus}
                showManualReview={p.creditCheckStatus === 'PENDING_MANUAL_REVIEW'}
              />
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Bereich C — Bewerbungen dieses Users</h2>
        <div className="mt-3 space-y-2">
          {user.rentalApplicationsAsApplicant.length === 0 ? (
            <p className="text-sm text-slate-600">Keine Bewerbungen vorhanden.</p>
          ) : (
            user.rentalApplicationsAsApplicant.map(app => (
              <div key={app.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-900">{app.listing.title}</p>
                <p className="text-slate-600">{app.listing.address}, {app.listing.city}</p>
                <p className="text-slate-600">Bewerbungsdatum: {formatDate(app.createdAt)} · Status: {app.status}</p>
                <Link href={`/wohnungen/${app.listing.id}`} className="font-semibold text-teal-700 hover:underline">
                  Zum Listing
                </Link>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
