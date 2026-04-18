import { authOptions } from '@/lib/auth'
import { requireMatchingAdmin } from '@/lib/matching/matching-ops-auth'
import { loadOpsSubmittedApplications } from '@/lib/matching/ops-submitted-applications'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Ops · Bewerbungen',
  description: 'Eingereichte Matching-Bewerbungen (Ops).',
}

export default async function MatchingOpsApplicationsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/ops/applications'))
  }

  const gate = await requireMatchingAdmin()
  if (!gate.ok) redirect('/matching')

  const rows = await loadOpsSubmittedApplications()

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Ops</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Bewerbungen (Warteschlange)
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Status <code className="rounded bg-slate-100 px-1 text-xs">submitted</code> oder{' '}
        <code className="rounded bg-slate-100 px-1 text-xs">landlord_reviewing</code>. Für Details inkl. Kontakt
        (nur Ops) die Zeile öffnen.
      </p>

      <div className="mt-8 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Erstellt</th>
              <th className="px-4 py-3">Objekt</th>
              <th className="px-4 py-3">Suchender (E-Mail)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Keine Einträge in der Warteschlange.
                </td>
              </tr>
            ) : (
              rows.map(r => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {new Date(r.createdAt).toLocaleString('de-CH')}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    <span className="font-medium">{r.propertyTitle}</span>
                    <span className="block text-xs text-slate-500">{r.propertyCity}</span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-700">{r.seekerEmail ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/matching/ops/applications/${r.id}`}
                      className="font-medium text-teal-800 underline-offset-2 hover:underline"
                    >
                      Öffnen
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-10 text-sm text-slate-500">
        <Link href="/matching/ops" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Ops-Übersicht
        </Link>
      </p>
    </main>
  )
}
