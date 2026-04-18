import { authOptions } from '@/lib/auth'
import { sendRentalApplicantSuccessEmail, sendRentalLandlordNewApplicationEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const rentalListingId = typeof body?.rentalListingId === 'string' ? body.rentalListingId.trim() : ''
    const rawMessage = typeof body?.message === 'string' ? body.message.trim() : ''
    const message = rawMessage.length > 0 ? rawMessage.slice(0, 500) : null

    if (!rentalListingId) {
      return NextResponse.json({ code: 'BAD_REQUEST', message: 'rentalListingId fehlt' }, { status: 400 })
    }

    const listing = await prisma.rentalListing.findFirst({
      where: { id: rentalListingId, status: 'active' },
      select: {
        id: true,
        userId: true,
        title: true,
        address: true,
        zip: true,
        city: true,
        rooms: true,
        rentPerMonth: true,
        requiresCreditCheck: true,
        status: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            name: true,
          },
        },
      },
    })

    if (!listing || !listing.user?.email) {
      return NextResponse.json({ code: 'LISTING_NOT_ACTIVE', message: 'Inserat nicht aktiv' }, { status: 404 })
    }

    if (listing.userId === userId) {
      return NextResponse.json({ code: 'FORBIDDEN', message: 'Eigenes Inserat' }, { status: 403 })
    }

    const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId } })
    if (!tenantProfile) {
      return NextResponse.json({ code: 'NO_PROFILE', message: 'Mieterprofil fehlt' }, { status: 403 })
    }
    if (!tenantProfile.isComplete) {
      return NextResponse.json({ code: 'NO_PROFILE', message: 'Profil unvollständig' }, { status: 403 })
    }

    if (listing.requiresCreditCheck) {
      const ok =
        tenantProfile.creditCheckStatus === 'APPROVED' &&
        tenantProfile.creditCheckExpiresAt != null &&
        tenantProfile.creditCheckExpiresAt.getTime() > Date.now()
      if (!ok) {
        return NextResponse.json({ code: 'CREDIT_CHECK_REQUIRED', message: 'Betreibungsregister erforderlich' }, { status: 403 })
      }
    }

    const blocking = await prisma.rentalApplication.findFirst({
      where: {
        rentalListingId,
        applicantUserId: userId,
        status: { in: ['pending_credit_check', 'pending_manual_review', 'approved'] },
      },
    })
    if (blocking) {
      return NextResponse.json({ code: 'ALREADY_APPLIED', message: 'Bereits beworben' }, { status: 409 })
    }

    const applicant = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, name: true, nickname: true },
    })
    if (!applicant?.email) {
      return NextResponse.json({ code: 'BAD_REQUEST', message: 'Keine E-Mail im Konto' }, { status: 400 })
    }
    const applicantDisplay = applicant.nickname?.trim() || applicant.name?.trim() || 'Helvenda-Nutzer'

    await prisma.rentalApplication.deleteMany({
      where: {
        rentalListingId,
        applicantUserId: userId,
        status: 'rejected',
      },
    })

    let applicationId: string
    try {
      const app = await prisma.rentalApplication.create({
        data: {
          rentalListingId,
          applicantUserId: userId,
          message,
          status: 'approved',
          tenantProfileId: tenantProfile.id,
        },
      })
      applicationId = app.id
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return NextResponse.json({ code: 'ALREADY_APPLIED', message: 'Bereits beworben' }, { status: 409 })
      }
      throw e
    }

    const applicantFullName = `${tenantProfile.firstName} ${tenantProfile.lastName}`.trim() || applicantDisplay
    const addressLine = `${listing.address}, ${listing.zip} ${listing.city}`

    const emailResults = await Promise.allSettled([
      sendRentalLandlordNewApplicationEmail({
        landlordEmail: listing.user.email,
        landlordUserId: listing.userId,
        landlordFirst: listing.user,
        listingId: listing.id,
        listingTitle: listing.title,
        applicantFullName,
        applicantMessage: message,
        requiresCreditCheck: listing.requiresCreditCheck,
        creditCheckResult: tenantProfile.creditCheckResult,
        employmentStatus: tenantProfile.employmentStatus,
        employer: tenantProfile.employer,
        monthlyIncomeCategory: tenantProfile.monthlyIncomeCategory,
        referenceName: tenantProfile.referenceName,
        referencePhone: tenantProfile.referencePhone,
      }),
      sendRentalApplicantSuccessEmail({
        applicantEmail: applicant.email,
        applicantUserId: userId,
        applicantFirst: applicant,
        listingTitle: listing.title,
        addressLine,
        rooms: listing.rooms,
        rentPerMonth: listing.rentPerMonth,
      }),
    ])
    emailResults.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error('[rental-applications] E-Mail fehlgeschlagen', { index: i, reason: r.reason })
      }
    })

    return NextResponse.json({ success: true, applicationId })
  } catch (e: unknown) {
    console.error('[rental-applications POST]', e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
