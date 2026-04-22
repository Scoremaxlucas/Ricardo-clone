import { AdminLeadDossierActions } from '@/components/admin/AdminLeadDossierActions'
import { authOptions } from '@/lib/auth'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { isAdmin } from '@/lib/auth/isAdmin'
import { evaluateMatch } from '@/lib/matching/evaluate-match'
import {
  hasAnyTenantPreferences,
  matchReasonToGermanLabel,
  tenantPreferencesToSeekerInput,
} from '@/lib/matching/tenant-preferences-match'
import { prisma } from '@/lib/prisma'
import { qualifyTenant } from '@/lib/rental/qualifyTenant'
import { incomeCategoryLabelDe } from '@/lib/tenant-profile/labels'
import { formatCHF } from '@/lib/utils/formatCurrency'
import { formatDate } from '@/lib/utils/formatDate'
import { getServerSession } from 'next-auth/next'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'Lead-Dossier',
  robots: { index: false, follow: false },
}

export default async function AdminApplicationDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (!(await isAdmin(session))) throwAdminForbidden()

  const { id } = await params
  const app = await prisma.rentalApplication.findUnique({
    where: { id },
    include: {
      listing: true,
      tenantProfile: true,
    },
  })
  if (!app || !app.tenantProfile) return notFound()

  const q = qualifyTenant(app.tenantProfile, app.listing)
  const c = (app.tenantProfile.creditCheckResult as Record<string, unknown> | null) || {}
  const hasPrefs = hasAnyTenantPreferences(app.tenantProfile)
  const match = hasPrefs
    ? evaluateMatch(
        tenantPreferencesToSeekerInput(app.tenantProfile),
        {
          id: app.listing.id,
          canton: app.listing.canton,
          zip: app.listing.zip,
          rooms: Number(app.listing.rooms),
          rentPerMonth: app.listing.rentPerMonth,
          availableFrom: app.listing.availableFrom,
          status: app.listing.status === 'active' ? 'active' : 'archived',
        },
        {}
      )
    : null

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Lead-Dossier</h1>
        <AdminLeadDossierActions applicationId={app.id} />
      </div>

      <article className="dossier rounded-xl border border-slate-300 bg-white p-6 text-sm text-slate-900">
        <section className="section">
          <h2 className="text-lg font-bold">HELVENDA WOHNUNGEN — LEAD DOSSIER</h2>
          <p>Erstellt: {formatDate(new Date())} &nbsp; Ref: {app.id}</p>
        </section>
        <section className="section">
          <h3 className="font-bold">WOHNUNG</h3>
          <p>{app.listing.title}</p>
          <p>{app.listing.address}, {app.listing.zip} {app.listing.city}</p>
          <p>{formatCHF(app.listing.rentPerMonth)}/Monat + NK {formatCHF(app.listing.utilitiesPerMonth || 0)}/Monat</p>
        </section>
        <section className="section">
          <h3 className="font-bold">BEWERBER</h3>
          <p>Name: {app.tenantProfile.firstName} {app.tenantProfile.lastName}</p>
          <p>Geburtsdatum: {formatDate(app.tenantProfile.dateOfBirth)}</p>
          <p>Aktuelle Adresse: {app.tenantProfile.currentAddress}</p>
        </section>
        <section className="section">
          <h3 className="font-bold">BESCHÄFTIGUNG & EINKOMMEN</h3>
          <p>Status: {app.tenantProfile.employmentStatus}</p>
          <p>Arbeitgeber: {app.tenantProfile.employer || '—'}</p>
          <p>Berufsbezeichnung: {app.tenantProfile.jobTitle || '—'}</p>
          <p>Monatliches Nettoeinkommen: {incomeCategoryLabelDe(app.tenantProfile.monthlyIncomeCategory)}</p>
          <p>Einkommens-Regel (3x Miete): {q.reasons.some(i => i.code === 'INCOME_TOO_LOW') ? '❌ Nicht erfüllt' : '✅ Erfüllt'}</p>
        </section>
        <section className="section">
          <h3 className="font-bold">BETREIBUNGSREGISTER</h3>
          <p>Status: {app.tenantProfile.creditCheckStatus === 'APPROVED' ? 'Keine Einträge ✅' : app.tenantProfile.creditCheckStatus}</p>
          <p>Ausgestellt: {String(c.issueDate || '—')} &nbsp; Kanton: {String(c.canton || '—')}</p>
          <p>Gültig bis: {app.tenantProfile.creditCheckExpiresAt ? formatDate(app.tenantProfile.creditCheckExpiresAt) : '—'}</p>
          <p>⚠️ Originaldokument verschlüsselt gespeichert — auf Anfrage verfügbar</p>
        </section>
        <section className="section">
          <h3 className="font-bold">REFERENZ</h3>
          <p>{app.tenantProfile.referenceName || '—'} · {app.tenantProfile.referenceRelation || '—'} · {app.tenantProfile.referencePhone || '—'}</p>
        </section>
        <section className="section">
          <h3 className="font-bold">NACHRICHT DES BEWERBERS</h3>
          <p>{app.message || '—'}</p>
        </section>
        <section className="section">
          <h3 className="font-bold">QUALIFIKATIONS-CHECK</h3>
          <p>{q.reasons.some(i => i.code === 'CREDIT_CHECK_MISSING' || i.code === 'CREDIT_CHECK_EXPIRED') ? '❌ Betreibungsregister gültig' : '✅ Betreibungsregister gültig'}</p>
          <p>{q.reasons.some(i => i.code === 'INCOME_TOO_LOW') ? '❌ Einkommen erfüllt 3x-Regel' : '✅ Einkommen erfüllt 3x-Regel'}</p>
          <p>{q.reasons.some(i => i.code === 'PROFILE_INCOMPLETE') ? '❌ Profil vollständig' : '✅ Profil vollständig'}</p>
          <p>{q.qualified ? '✅ Alle Anforderungen erfüllt' : '⚠️ Anforderungen noch nicht vollständig erfüllt'}</p>
        </section>
        <section className="section">
          <h3 className="font-bold">MATCHING (MIETERWÜNSCHE)</h3>
          {!hasPrefs ? (
            <p>— Keine Suchpräferenzen hinterlegt.</p>
          ) : (
            <>
              <p>{match?.hardFailed ? '❌ Harte Präferenzen nicht erfüllt' : '✅ Präferenzen erfüllt'}</p>
              <p>Match-Score: <strong>{match?.score ?? 0}%</strong></p>
              <p>
                Gründe:{' '}
                {(match?.reasons?.length ?? 0) > 0
                  ? match?.reasons.map(r => matchReasonToGermanLabel(r)).join(', ')
                  : 'Keine spezifischen Match-Hinweise'}
              </p>
            </>
          )}
        </section>
      </article>

      <style>{`
        .section { border-top: 1px solid #e2e8f0; padding: 12px 0; }
        .section:first-child { border-top: 0; padding-top: 0; }
        @media print {
          .no-print { display: none !important; }
          header, footer, nav { display: none !important; }
          main { max-width: 100% !important; padding: 0 !important; }
          .dossier { border: none !important; border-radius: 0 !important; box-shadow: none !important; }
          .section { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </main>
  )
}
