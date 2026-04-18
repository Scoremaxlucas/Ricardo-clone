import { OpsDocumentQueue } from '@/components/matching/OpsDocumentQueue'
import { authOptions } from '@/lib/auth'
import { requireMatchingAdmin } from '@/lib/matching/matching-ops-auth'
import { loadOpsPendingMatchingDocuments } from '@/lib/matching/ops-pending-documents'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth/next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Ops · Dokumente',
  description: 'Ausstehende Matching-Nachweise prüfen.',
}

export default async function MatchingOpsDocumentsPage() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/matching/ops/documents'))
  }

  const gate = await requireMatchingAdmin()
  if (!gate.ok) redirect('/matching')

  const rows = await loadOpsPendingMatchingDocuments()

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Ops</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dokumenten-Warteschlange</h1>
      <p className="mt-2 text-sm text-slate-600">
        Einträge mit Verifikationsstatus «pending». Freigabe setzt das Dokument auf «verified», Ablehnung auf
        «rejected».
      </p>
      <div className="mt-8">
        <OpsDocumentQueue rows={rows} />
      </div>
      <p className="mt-10 text-sm text-slate-500">
        <Link href="/matching/ops" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Ops-Übersicht
        </Link>
        {' · '}
        <Link href="/matching" className="font-medium text-teal-800 underline-offset-2 hover:underline">
          Matching
        </Link>
      </p>
    </main>
  )
}
