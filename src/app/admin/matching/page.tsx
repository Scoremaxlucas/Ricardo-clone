import { authOptions } from '@/lib/auth'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Matching Ops',
  description: 'Einstieg zu Helvenda Matching Ops (wohnen.helvenda.ch).',
}

export default async function AdminMatchingOpsEntryPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/admin/matching'))
  }

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })
  const isAdmin = u?.isAdmin === true || session.user?.isAdmin === true
  if (!isAdmin) {
    redirect('/admin/dashboard')
  }

  const opsBase = `${WOHNEN_SITE_ORIGIN}/matching/ops`

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-slate-900">Matching Ops</h1>
      <p className="mt-3 text-slate-600">
        Warteschlangen und Audit für das Produkt «Helvenda Matching» laufen auf der Subdomain{' '}
        <strong className="font-medium text-slate-800">wohnen.helvenda.ch</strong> (gleiches Login).
      </p>
      <ul className="mt-8 space-y-3 text-teal-800">
        <li>
          <a href={`${WOHNEN_SITE_ORIGIN}/matching/match-objekte`} className="font-medium underline-offset-2 hover:underline">
            Meine Objekte (Vermieter) →
          </a>
        </li>
        <li>
          <a href={`${opsBase}`} className="font-medium underline-offset-2 hover:underline">
            Ops-Übersicht öffnen →
          </a>
        </li>
        <li>
          <a href={`${opsBase}/documents`} className="font-medium underline-offset-2 hover:underline">
            Dokumenten-Warteschlange →
          </a>
        </li>
        <li>
          <a href={`${opsBase}/applications`} className="font-medium underline-offset-2 hover:underline">
            Bewerbungen (Ops) →
          </a>
        </li>
        <li>
          <a href={`${opsBase}/audit`} className="font-medium underline-offset-2 hover:underline">
            Audit-Suche →
          </a>
        </li>
        <li>
          <a href={`${opsBase}/jobs`} className="font-medium underline-offset-2 hover:underline">
            Jobs / Outbox →
          </a>
        </li>
      </ul>
      <p className="mt-10 text-sm text-slate-500">
        <Link href="/admin/dashboard" className="text-teal-800 hover:underline">
          Admin-Dashboard
        </Link>
      </p>
    </main>
  )
}
