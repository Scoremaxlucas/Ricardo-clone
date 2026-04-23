import { authOptions } from '@/lib/auth'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils/formatDate'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'User-Verwaltung',
  robots: { index: false, follow: false },
}

type FilterKey = 'all' | 'tenants' | 'landlords' | 'admins' | 'pending_review'

function profileStatus(profile: { isComplete: boolean } | null): { label: string; cls: string } {
  if (!profile) return { label: 'Keins ❌', cls: 'bg-slate-100 text-slate-700' }
  if (profile.isComplete) return { label: 'Vollständig ✅', cls: 'bg-emerald-100 text-emerald-800' }
  return { label: 'Unvollständig ⚠️', cls: 'bg-amber-100 text-amber-900' }
}

function creditBadge(profile: {
  creditCheckStatus: string
  creditCheckExpiresAt: Date | null
} | null): { label: string; cls: string } {
  if (!profile) return { label: 'Keines', cls: 'bg-slate-100 text-slate-700' }
  switch (profile.creditCheckStatus) {
    case 'NONE':
      return { label: 'Keines', cls: 'bg-slate-100 text-slate-700' }
    case 'PENDING':
      return { label: 'Wird geprüft', cls: 'bg-amber-100 text-amber-900' }
    case 'PENDING_MANUAL_REVIEW':
      return { label: 'Manuelle Prüfung ⚠️', cls: 'bg-orange-100 text-orange-900' }
    case 'APPROVED':
      return {
        label: `Gültig bis ${profile.creditCheckExpiresAt ? formatDate(profile.creditCheckExpiresAt) : '—'}`,
        cls: 'bg-emerald-100 text-emerald-800',
      }
    case 'EXPIRED':
      return { label: 'Abgelaufen', cls: 'bg-rose-100 text-rose-800' }
    case 'REJECTED':
      return { label: 'Abgelehnt', cls: 'bg-rose-100 text-rose-800' }
    default:
      return { label: String(profile.creditCheckStatus), cls: 'bg-slate-100 text-slate-700' }
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/admin/users'))
  }
  if (!(await isAdmin(session))) throwAdminForbidden()

  const params = await searchParams
  const q = (params.q || '').trim().toLowerCase()
  const filter = (params.filter || 'all') as FilterKey

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      isAdmin: true,
      createdAt: true,
      tenantProfile: {
        select: {
          isComplete: true,
          creditCheckStatus: true,
          creditCheckExpiresAt: true,
        },
      },
      _count: {
        select: {
          rentalApplicationsAsApplicant: true,
          rentalListings: true,
        },
      },
      rentalListings: {
        where: { status: 'active' },
        select: { id: true },
      },
    },
  })

  const stats = {
    total: users.length,
    completeProfiles: users.filter(u => u.tenantProfile?.isComplete).length,
    validCredit: users.filter(
      u =>
        u.tenantProfile?.creditCheckStatus === 'APPROVED' &&
        u.tenantProfile.creditCheckExpiresAt &&
        u.tenantProfile.creditCheckExpiresAt.getTime() > Date.now()
    ).length,
    landlords: users.filter(u => u.rentalListings.length > 0).length,
  }

  const filtered = users.filter(u => {
    const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
    const matchesQ =
      !q ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      fullName.toLowerCase().includes(q)
    if (!matchesQ) return false

    if (filter === 'admins') return u.isAdmin
    if (filter === 'landlords') return u.rentalListings.length > 0
    if (filter === 'tenants') return Boolean(u.tenantProfile)
    if (filter === 'pending_review') return u.tenantProfile?.creditCheckStatus === 'PENDING_MANUAL_REVIEW'
    return true
  })

  const tabs: Array<{ key: FilterKey; label: string }> = [
    { key: 'all', label: 'Alle' },
    { key: 'tenants', label: 'Mietende' },
    { key: 'landlords', label: 'Vermieter' },
    { key: 'admins', label: 'Admins' },
    { key: 'pending_review', label: 'Ausstehende Reviews' },
  ]

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900">User-Verwaltung</h1>
      <p className="mt-1 text-sm text-slate-600">Vollständige Übersicht über Konten, Profile und Status des Betreibungsregisterauszugs.</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Gesamt registrierte User</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">User mit vollständigem Mieter-Profil</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.completeProfiles}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">User mit gültigem Betreibungsregisterauszug</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.validCredit}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Vermieter (mind. 1 aktives Listing)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{stats.landlords}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <form className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Suche nach Name oder E-Mail"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input type="hidden" name="filter" value={filter} />
          <button type="submit" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
            Suchen
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map(t => (
            <Link
              key={t.key}
              href={`/admin/users?filter=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                filter === t.key ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Name + E-Mail</th>
              <th className="px-4 py-3">Registriert am</th>
              <th className="px-4 py-3">Rolle</th>
              <th className="px-4 py-3">Profil-Status</th>
              <th className="px-4 py-3">Betreibungsregisterauszug</th>
              <th className="px-4 py-3">Bewerbungen</th>
              <th className="px-4 py-3">Inserate</th>
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const name = u.name?.trim() || [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || '—'
              const role = u.isAdmin ? 'Admin' : u.rentalListings.length > 0 ? 'Vermieter' : 'Mieter'
              const p = profileStatus(u.tenantProfile)
              const c = creditBadge(u.tenantProfile)
              return (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">{role}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${p.cls}`}>{p.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${c.cls}`}>{c.label}</span>
                  </td>
                  <td className="px-4 py-3">{u._count.rentalApplicationsAsApplicant}</td>
                  <td className="px-4 py-3">{u._count.rentalListings}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/users/${u.id}`} className="font-semibold text-teal-700 hover:underline">
                      Details
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-600">
          Keine User für den gewählten Filter gefunden.
        </div>
      ) : null}
    </main>
  )
}
