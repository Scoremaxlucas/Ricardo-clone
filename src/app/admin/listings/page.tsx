import { AdminListingsClient, type AdminListingAttentionRow, type AdminListingRow } from '@/components/admin/AdminListingsClient'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import type { DeactivationReason, ImportSource } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import type { Metadata } from 'next'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inserat-Verwaltung',
  robots: { index: false, follow: false },
}

function displayUserName(u: {
  name: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
}): string {
  const n = u.name?.trim()
  if (n) return n
  const fl = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  if (fl) return fl
  return u.email || 'Benutzer'
}

function deactivationReasonDe(r: DeactivationReason | null): string {
  if (!r) return 'Unbekannt'
  switch (r) {
    case 'URL_404':
      return 'URL 404'
    case 'URL_RENTED':
      return '«Vergeben» laut Original-URL'
    case 'STALE_REPORTS':
      return 'Mehrere Bewerber-Meldungen'
    case 'MANUAL_ADMIN':
      return 'Manuell durch Admin'
    default:
      return String(r)
  }
}

function buildCreator(
  importSource: ImportSource,
  importedFrom: string | null,
  user: { isAdmin: boolean | null; name: string | null; firstName: string | null; lastName: string | null; email: string | null }
): Pick<AdminListingRow, 'creatorKind' | 'creatorLabel'> {
  if (importSource === 'IMPORTED' || importSource === 'PARTNER') {
    return { creatorKind: 'import', creatorLabel: importedFrom || '—' }
  }
  if (user.isAdmin === true) {
    return { creatorKind: 'admin', creatorLabel: 'Admin' }
  }
  return { creatorKind: 'landlord', creatorLabel: displayUserName(user) }
}

export default async function AdminListingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/admin/listings'))
  }
  if (!(await isAdmin(session))) {
    throwAdminForbidden()
  }

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
  const sevenDaysAgoAttention = new Date()
  sevenDaysAgoAttention.setDate(sevenDaysAgoAttention.getDate() - 7)

  const [total, active, addedThisWeek, totalApplications, rawListings, unreachableRows, staleRows, recentOff] =
    await Promise.all([
    prisma.rentalListing.count(),
    prisma.rentalListing.count({ where: { status: 'active' } }),
    prisma.rentalListing.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.rentalApplication.count(),
    prisma.rentalListing.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: {
          select: {
            isAdmin: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: { select: { applications: true } },
      },
    }),
    prisma.rentalListing.findMany({
      where: {
        status: 'active',
        lastCheckStatus: 'UNREACHABLE',
        lastCheckedAt: { lt: threeDaysAgo },
      },
      select: { id: true, title: true, address: true, lastCheckedAt: true },
    }),
    prisma.rentalListing.findMany({
      where: {
        status: 'active',
        staleReportCount: { gte: 1 },
      },
      select: { id: true, title: true, address: true, staleReportedAt: true },
    }),
    prisma.rentalListing.findMany({
      where: {
        autoDeactivatedAt: { gte: sevenDaysAgoAttention },
      },
      select: {
        id: true,
        title: true,
        address: true,
        autoDeactivatedAt: true,
        autoDeactivatedReason: true,
      },
    }),
  ])

  type Agg = { id: string; title: string; address: string; reasons: string[]; sortTs: number }
  const agg = new Map<string, Agg>()
  function touch(id: string, title: string, address: string, reason: string, ts: number) {
    const ex = agg.get(id)
    if (!ex) {
      agg.set(id, { id, title, address, reasons: [reason], sortTs: ts })
      return
    }
    if (!ex.reasons.includes(reason)) ex.reasons.push(reason)
    ex.sortTs = Math.max(ex.sortTs, ts)
  }
  for (const r of unreachableRows) {
    touch(
      r.id,
      r.title,
      r.address,
      'URL seit mehr als 3 Tagen nicht erreichbar (letzter Check)',
      r.lastCheckedAt?.getTime() ?? 0,
    )
  }
  for (const r of staleRows) {
    touch(
      r.id,
      r.title,
      r.address,
      'Mindestens eine Bewerber-Meldung („vergeben“)',
      r.staleReportedAt?.getTime() ?? 0,
    )
  }
  for (const r of recentOff) {
    const ts = r.autoDeactivatedAt?.getTime() ?? 0
    touch(
      r.id,
      r.title,
      r.address,
      `Kürzlich automatisch deaktiviert: ${deactivationReasonDe(r.autoDeactivatedReason)}`,
      ts,
    )
  }
  const attentionItems: AdminListingAttentionRow[] = Array.from(agg.values())
    .sort((a, b) => b.sortTs - a.sortTs)
    .map(a => ({
      id: a.id,
      title: a.title,
      address: a.address,
      reasonLines: a.reasons,
      dateLabel:
        a.sortTs > 0 ?
          new Date(a.sortTs).toLocaleString('de-CH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '—',
    }))

  const listings: AdminListingRow[] = rawListings.map(l => {
    const cr = buildCreator(l.importSource, l.importedFrom, l.user)
    return {
      id: l.id,
      title: l.title,
      address: l.address,
      canton: l.canton,
      rentPerMonth: l.rentPerMonth,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
      applicationsCount: l._count.applications,
      creatorKind: cr.creatorKind,
      creatorLabel: cr.creatorLabel,
      importSource: l.importSource,
      importedFrom: l.importedFrom,
    }
  })

  return (
    <AdminListingsClient
      listings={listings}
      attentionItems={attentionItems}
      stats={{
        total,
        active,
        addedThisWeek,
        totalApplications,
      }}
    />
  )
}
