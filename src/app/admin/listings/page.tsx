import { AdminListingsClient, type AdminListingRow } from '@/components/admin/AdminListingsClient'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import type { ImportSource } from '@prisma/client'
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

  const [total, active, addedThisWeek, totalApplications, rawListings] = await Promise.all([
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
  ])

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
      stats={{
        total,
        active,
        addedThisWeek,
        totalApplications,
      }}
    />
  )
}
