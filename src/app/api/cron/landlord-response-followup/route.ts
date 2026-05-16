/**
 * Täglich: Mieter informieren, wenn Vermieter nach Frist keine Rückmeldung erfasst hat.
 */

import { LANDLORD_NO_RESPONSE_NOTIFY_DAYS } from '@/lib/rental/landlord-lead-token'
import { sendRentalApplicantLandlordNoResponseEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { RentalApplicationStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - LANDLORD_NO_RESPONSE_NOTIFY_DAYS * 24 * 60 * 60 * 1000)

  const apps = await prisma.rentalApplication.findMany({
    where: {
      status: RentalApplicationStatus.approved,
      createdAt: { lte: cutoff },
      rejectedAt: null,
      viewingRequestedAt: null,
      landlordRespondedAt: null,
      landlordNoResponseNotifiedAt: null,
    },
    include: {
      listing: { select: { title: true } },
      applicant: { select: { id: true, email: true, firstName: true, name: true } },
    },
    take: 100,
  })

  let sent = 0
  const errors: string[] = []

  for (const app of apps) {
    if (!app.applicant.email) continue
    const daysSince = Math.max(
      LANDLORD_NO_RESPONSE_NOTIFY_DAYS,
      Math.floor((Date.now() - app.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
    )
    try {
      await sendRentalApplicantLandlordNoResponseEmail({
        applicantEmail: app.applicant.email,
        applicantUserId: app.applicant.id,
        applicantFirst: app.applicant,
        listingTitle: app.listing.title,
        daysSinceApplication: daysSince,
      })
      await prisma.rentalApplication.update({
        where: { id: app.id },
        data: { landlordNoResponseNotifiedAt: new Date() },
      })
      sent++
    } catch (e) {
      errors.push(`${app.id}: ${e instanceof Error ? e.message : 'error'}`)
    }
  }

  return NextResponse.json({ ok: true, scanned: apps.length, sent, errors })
}
