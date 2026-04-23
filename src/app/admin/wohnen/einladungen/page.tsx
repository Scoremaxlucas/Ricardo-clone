import { authOptions } from '@/lib/auth'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { isAdmin } from '@/lib/auth/isAdmin'
import { getServerSession } from 'next-auth/next'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { RentalInviteAdminClient } from './RentalInviteAdminClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'E-Mail-Einladung Inserat',
  robots: { index: false, follow: false },
}

export default async function AdminWohnenEinladungenPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=' + encodeURIComponent('/admin/wohnen/einladungen'))
  if (!(await isAdmin(session))) throwAdminForbidden()

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Link href="/admin/wohnen" className="text-sm font-medium text-teal-800 hover:underline">
        ← Admin-Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0d2b1f] sm:text-3xl">E-Mail-Einladung (Inserat-URL)</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Externe Kontakte reichen die Original-URL ein; Helvenda importiert automatisch. Bei Problemen erscheint ein
        Eintrag unter «Entwurf / manuell» — Quell-URL und Fehlertext helfen dir beim Finalisieren im URL-Ingest.
      </p>
      <div className="mt-8">
        <RentalInviteAdminClient />
      </div>
    </main>
  )
}
