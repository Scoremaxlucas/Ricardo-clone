import { logAdminAudit } from '@/lib/admin/auditLog'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/auth/isAdmin'
import { prisma } from '@/lib/prisma'
import { runSingleRentalListingUrlCheck } from '@/lib/rental/listing-url-check'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !(await isAdmin(session))) {
    return NextResponse.json({ message: 'Zugriff verweigert' }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as { action?: string } | null
  const action = body?.action
  if (!id || (action !== 'recheck_now' && action !== 'dismiss_concern')) {
    return NextResponse.json({ message: 'Ungültige Anfrage' }, { status: 400 })
  }

  const listing = await prisma.rentalListing.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      importedFrom: true,
      lastCheckStatus: true,
      urlUnreachableStreak: true,
    },
  })
  if (!listing) {
    return NextResponse.json({ message: 'Inserat nicht gefunden' }, { status: 404 })
  }

  if (action === 'dismiss_concern') {
    await prisma.rentalListing.update({
      where: { id },
      data: {
        lastCheckStatus: 'ACTIVE',
        lastCheckedAt: new Date(),
        urlUnreachableStreak: 0,
      },
    })
    await logAdminAudit({
      adminUserId: session.user.id,
      action: 'RENTAL_LISTING_URL_CONCERN_DISMISS',
      entityType: 'RentalListing',
      entityId: id,
      metadata: {
        previousStatus: listing.lastCheckStatus,
        importedFrom: listing.importedFrom?.slice(0, 300) ?? null,
      },
    })
    revalidatePath('/admin/wohnen/betrieb')
    revalidatePath('/admin/listings')
    return NextResponse.json({ success: true, message: 'URL-Hinweis vorerst ausgeblendet' })
  }

  const result = await runSingleRentalListingUrlCheck(id)
  if (!result.ok) {
    return NextResponse.json({ message: 'Inserat nicht gefunden' }, { status: 404 })
  }

  await logAdminAudit({
    adminUserId: session.user.id,
    action: 'RENTAL_LISTING_URL_RECHECK',
    entityType: 'RentalListing',
    entityId: id,
    metadata: {
      outcome: result.outcome,
      lastCheckStatus: result.lastCheckStatus,
      detail: result.detail ?? null,
    },
  })

  revalidatePath('/admin/wohnen/betrieb')
  revalidatePath('/admin/listings')
  revalidatePath('/wohnungen')
  revalidatePath('/matching/properties')

  return NextResponse.json({
    success: true,
    message: `URL-Prüfung abgeschlossen: ${result.outcome}`,
    outcome: result.outcome,
    lastCheckStatus: result.lastCheckStatus,
    detail: result.detail ?? null,
  })
}
