import { authOptions } from '@/lib/auth'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { isAdmin } from '@/lib/auth/isAdmin'
import { getServerSession } from 'next-auth/next'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IngestDraftsClient } from './IngestDraftsClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Import-Entwürfe — Mietinserate',
  robots: { index: false, follow: false },
}

export default async function AdminIngestDraftsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/admin/listings/ingest-entwuerfe'))
  }
  if (!(await isAdmin(session))) {
    throwAdminForbidden()
  }

  return <IngestDraftsClient />
}
