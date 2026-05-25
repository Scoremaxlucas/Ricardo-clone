import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { ensureExternalLandlordForListingInput } from '@/lib/external-landlords/crm'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const rows = await prisma.rentalListing.findMany({
    where: {
      externalLandlordId: null,
      OR: [
        { importSource: { not: 'SELF' } },
        { user: { isAdmin: true } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 500,
    select: {
      id: true,
      title: true,
      address: true,
      city: true,
      landlordNotifyEmail: true,
      landlordContact: true,
      ingestPermissionBasis: true,
    },
  })

  for (const row of rows) {
    await ensureExternalLandlordForListingInput({
      db: prisma,
      rentalListingId: row.id,
      landlordNotifyEmail: row.landlordNotifyEmail,
      landlordContactStored: row.landlordContact,
      ingestPermissionBasis: row.ingestPermissionBasis,
      fallbackDisplayName:
        row.address.trim() ? `${row.address.trim()} · ${row.city.trim()}` : row.title.trim(),
    })
  }

  return NextResponse.json({
    success: true,
    processed: rows.length,
  })
}
