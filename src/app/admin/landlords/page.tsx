import { ExternalLandlordsIndexClient } from '@/components/admin/ExternalLandlordsIndexClient'
import { ExternalLandlordSyncButton } from '@/components/admin/ExternalLandlordSyncButton'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { externalLandlordDisplayName } from '@/lib/external-landlords/crm'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Vermieter-CRM',
  robots: { index: false, follow: false },
}

export default async function AdminExternalLandlordsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/admin/landlords'))
  }
  if (!(await isAdmin(session))) {
    throwAdminForbidden()
  }

  const [rows, totalLandlords, totalLinkedListings, pendingSyncCount] = await Promise.all([
    prisma.externalLandlord.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 300,
      select: {
        id: true,
        displayName: true,
        kind: true,
        normalizedPrimaryEmail: true,
        normalizedPrimaryPhone: true,
        updatedAt: true,
        _count: {
          select: {
            listings: true,
            contacts: true,
            permissions: true,
            attachments: true,
          },
        },
      },
    }),
    prisma.externalLandlord.count(),
    prisma.rentalListing.count({ where: { externalLandlordId: { not: null } } }),
    prisma.rentalListing.count({
      where: {
        externalLandlordId: null,
        OR: [{ importSource: { not: 'SELF' } }, { user: { isAdmin: true } }],
      },
    }),
  ])
  const duplicateKeyCount = new Map<string, number>()
  for (const row of rows) {
    if (row.normalizedPrimaryEmail) {
      duplicateKeyCount.set(`email:${row.normalizedPrimaryEmail}`, (duplicateKeyCount.get(`email:${row.normalizedPrimaryEmail}`) ?? 0) + 1)
    }
    if (row.normalizedPrimaryPhone) {
      duplicateKeyCount.set(`phone:${row.normalizedPrimaryPhone}`, (duplicateKeyCount.get(`phone:${row.normalizedPrimaryPhone}`) ?? 0) + 1)
    }
  }
  const clientRows = rows.map(row => ({
    id: row.id,
    label: externalLandlordDisplayName(
      row.displayName,
      row.normalizedPrimaryEmail,
      row.normalizedPrimaryPhone
    ),
    kind: row.kind,
    primaryEmail: row.normalizedPrimaryEmail,
    primaryPhone: row.normalizedPrimaryPhone,
    listingsCount: row._count.listings,
    contactsCount: row._count.contacts,
    permissionsCount: row._count.permissions,
    attachmentsCount: row._count.attachments,
    updatedAtLabel: row.updatedAt.toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    hasPotentialDuplicate:
      (row.normalizedPrimaryEmail ? (duplicateKeyCount.get(`email:${row.normalizedPrimaryEmail}`) ?? 0) > 1 : false) ||
      (row.normalizedPrimaryPhone ? (duplicateKeyCount.get(`phone:${row.normalizedPrimaryPhone}`) ?? 0) > 1 : false),
  }))
  const duplicateCandidates = clientRows.filter(row => row.hasPotentialDuplicate).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <div className="mb-2">
        <Link href="/admin/listings" className="text-sm font-medium text-teal-800 hover:underline">
          ← Zurück zu Inserat-Verwaltung
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Vermieter-CRM</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Externe Vermieter ohne Helvenda-Konto: zentrale Kontakte, Berechtigungen, Nachweise und verknüpfte Inserate.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Externe Vermieter</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalLandlords}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verknüpfte Inserate</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalLinkedListings}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <p className="mt-1 text-sm font-medium text-slate-700">Neue Admin-/Import-Inserate werden automatisch verknüpft.</p>
          <p className="mt-2 text-xs text-slate-500">{duplicateCandidates} potenzielle Duplikate erkannt</p>
        </div>
      </div>

      <div className="mt-6">
        <ExternalLandlordSyncButton pendingCount={pendingSyncCount} />
      </div>

      <ExternalLandlordsIndexClient rows={clientRows} />
    </div>
  )
}
