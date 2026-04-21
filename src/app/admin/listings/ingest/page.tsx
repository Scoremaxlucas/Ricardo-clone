import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { getServerSession } from 'next-auth/next'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { IngestClient } from './IngestClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Neues Inserat — Automatischer Import',
  robots: { index: false, follow: false },
}

export default async function AdminListingIngestPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/admin/listings/ingest'))
  }
  if (!(await isAdmin(session))) {
    throwAdminForbidden()
  }

  return <IngestClient />
}
