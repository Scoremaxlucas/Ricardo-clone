import { authOptions } from '@/lib/auth'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { isAdmin } from '@/lib/auth/isAdmin'
import { MAIN_SHOP_ORIGIN } from '@/lib/site-urls'
import { prisma } from '@/lib/prisma'
import { CreditCheckStatus, RentalApplicationStatus, RentalListingStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import type { Metadata } from 'next'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, Building2, ClipboardList, LayoutDashboard, Mail, Shield, Upload, Users } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin — Helvenda Wohnungen',
  robots: { index: false, follow: false },
}

export default async function AdminWohnenDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=' + encodeURIComponent('/admin/wohnen'))
  if (!(await isAdmin(session))) throwAdminForbidden()

  const [
    activeListings,
    applicationsTotal,
    applicationsPendingReview,
    applicationsPendingCredit,
    creditPendingManual,
  ] = await Promise.all([
    prisma.rentalListing.count({ where: { status: RentalListingStatus.active } }),
    prisma.rentalApplication.count(),
    prisma.rentalApplication.count({ where: { status: RentalApplicationStatus.pending_manual_review } }),
    prisma.rentalApplication.count({ where: { status: RentalApplicationStatus.pending_credit_check } }),
    prisma.tenantProfile.count({ where: { creditCheckStatus: CreditCheckStatus.PENDING_MANUAL_REVIEW } }),
  ])

  const shopAdminUrl = `${MAIN_SHOP_ORIGIN}/admin/dashboard`

  const pendingApps = applicationsPendingReview + applicationsPendingCredit

  const cards: Array<{
    href: string
    title: string
    desc: string
    icon: LucideIcon
    stat?: number
    statLabel?: string
    badge?: number
    external?: boolean
  }> = [
    {
      href: '/admin/listings',
      title: 'Mietinserate',
      desc: 'Alle Inserate, Status, Aktionen',
      icon: Building2,
      stat: activeListings,
      statLabel: 'aktiv',
    },
    {
      href: '/admin/listings/ingest',
      title: 'URL-Ingest',
      desc: 'Inserate per Link importieren',
      icon: Upload,
    },
    {
      href: '/admin/wohnen/einladungen',
      title: 'E-Mail-Einladung',
      desc: 'Externe Person reicht Inserat-URL per Mail ein',
      icon: Mail,
    },
    {
      href: '/admin/applications',
      title: 'Bewerbungen',
      desc: 'Mietanfragen & Status',
      icon: ClipboardList,
      stat: applicationsTotal,
      statLabel: 'total',
      badge: pendingApps > 0 ? pendingApps : undefined,
    },
    {
      href: '/admin/matching',
      title: 'Matching Ops',
      desc: 'Warteschlangen, Audit, Jobs',
      icon: LayoutDashboard,
    },
    {
      href: `${MAIN_SHOP_ORIGIN}/admin/users?filter=pending_review`,
      title: 'Manuelle Reviews',
      desc: 'Betreibungsregisterauszüge — Marktplatz-Admin (www)',
      icon: Shield,
      stat: creditPendingManual,
      statLabel: 'offen',
      external: true,
    },
    {
      href: `${MAIN_SHOP_ORIGIN}/admin/users`,
      title: 'User & Konten',
      desc: 'Marktplatz-Administration',
      icon: Users,
      external: true,
    },
  ]

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-wide text-[#107a5a]">Helvenda Wohnungen</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0d2b1f] sm:text-3xl">Admin-Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Übersicht und Schnellzugriff für Mieten, Inserate und Matching. Den vollständigen Marktplatz-Admin (Uhren,
          Orders, …) findest du auf der Hauptdomain.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {cards.map(c => {
            const Icon = c.icon
            const inner = (
              <div className="group flex h-full flex-col rounded-xl border border-slate-200 bg-[#fafdfb] p-5 transition hover:border-teal-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#e8f7f2] text-[#107a5a]">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  {c.external ?
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-teal-700" aria-hidden />
                  : null}
                </div>
                <h2 className="mt-4 text-base font-bold text-slate-900">{c.title}</h2>
                <p className="mt-1 flex-1 text-sm text-slate-600">{c.desc}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {c.stat !== undefined && c.statLabel ?
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {c.stat} {c.statLabel}
                    </span>
                  : null}
                  {c.badge !== undefined && c.badge > 0 ?
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                      {c.badge} wartend
                    </span>
                  : null}
                </div>
              </div>
            )

            return c.external ?
                <a key={c.href} href={c.href} className="block min-h-[44px]">
                  {inner}
                </a>
              : <Link key={c.href} href={c.href} className="block min-h-[44px]">
                  {inner}
                </Link>
          })}
        </div>

        <p className="mt-10 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
          <a
            href={shopAdminUrl}
            className="font-semibold text-teal-800 underline-offset-2 hover:text-teal-950 hover:underline"
          >
            Zum Helvenda-Marktplatz-Admin (www)
          </a>
        </p>
      </div>
    </main>
  )
}
