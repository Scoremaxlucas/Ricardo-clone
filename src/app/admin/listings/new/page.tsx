import { RentalListingLandlordForm } from '@/components/rental/RentalListingLandlordForm'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { getServerSession } from 'next-auth/next'
import type { Metadata } from 'next'
import { throwAdminForbidden } from '@/lib/auth/admin-forbidden-html'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Neues Inserat (Admin)',
  robots: { index: false, follow: false },
}

export default async function AdminNewListingPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=' + encodeURIComponent('/admin/listings/new'))
  }
  if (!(await isAdmin(session))) {
    throwAdminForbidden()
  }

  return (
    <RentalListingLandlordForm
      mode="create"
      variant="admin"
      minPhotos={0}
      adminShowAcquisitionFields
      submitApiPath="/api/admin/rental-listings"
      afterSaveRedirect="/admin/listings"
      backHref="/admin/listings"
    />
  )
}
