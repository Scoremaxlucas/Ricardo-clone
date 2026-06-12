import { WohnenPlacementsAdminClient } from '@/components/admin/WohnenPlacementsAdminClient'
import { authOptions } from '@/lib/auth'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { isAdmin } from '@/lib/auth/isAdmin'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Vermittlungen & Abrechnung | Admin Wohnen',
  robots: { index: false, follow: false },
}

export default async function AdminWohnenPlacementsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login?callbackUrl=' + encodeURIComponent('/admin/wohnen/placements'))
  if (!(await isAdmin(session))) throwAdminForbidden()

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Link href="/admin/wohnen" className="text-sm font-medium text-teal-800 hover:underline">
        ← Admin Wohnen
      </Link>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0d2b1f]">Vermittlungen & Abrechnung</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Erfolgsprovision (Vermieter) und Einzugsbonus (Mieter) manuell erfassen und den Status pflegen — bis
        Stripe/Bexio-Anbindung live ist.
      </p>
      <div className="mt-8">
        <WohnenPlacementsAdminClient />
      </div>
    </main>
  )
}
