import { Prisma } from '@prisma/client'
import { sendRentalApplicantSuccessEmail, sendRentalLandlordNewApplicationEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { qualifyTenant, type QualificationIssue } from '@/lib/rental/qualifyTenant'

export type CreateRentalApplicationErrorCode =
  | 'LISTING_NOT_ACTIVE'
  | 'FORBIDDEN'
  | 'NO_PROFILE'
  | 'NOT_QUALIFIED'
  | 'ALREADY_APPLIED'
  | 'NO_EMAIL'

export type CreateRentalApplicationResult =
  | { ok: true; applicationId: string }
  | {
      ok: false
      status: number
      code: CreateRentalApplicationErrorCode
      message: string
      issues?: QualificationIssue[]
    }

const LISTING_SELECT = {
  id: true,
  userId: true,
  title: true,
  address: true,
  zip: true,
  city: true,
  rooms: true,
  rentPerMonth: true,
  utilitiesPerMonth: true,
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
} as const

/**
 * Einheitliche Bewerbung auf ein Mietinserat: Profil + qualifyTenant + sofort genehmigter Lead für den Vermieter.
 * Wird von POST /api/rental-applications und (legacy) POST /api/rental-listings/[id]/contact genutzt.
 */
export async function createQualifiedRentalApplication(params: {
  userId: string
  rentalListingId: string
  message: string | null
}): Promise<CreateRentalApplicationResult> {
  const { userId, rentalListingId, message } = params

  const listing = await prisma.rentalListing.findFirst({
    where: { id: rentalListingId, status: 'active' },
    select: LISTING_SELECT,
  })

  if (!listing || !listing.user?.email) {
    return { ok: false, status: 404, code: 'LISTING_NOT_ACTIVE', message: 'Inserat nicht aktiv' }
  }

  if (listing.userId === userId) {
    return { ok: false, status: 403, code: 'FORBIDDEN', message: 'Eigenes Inserat' }
  }

  const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId } })
  if (!tenantProfile) {
    return { ok: false, status: 403, code: 'NO_PROFILE', message: 'Mieterprofil fehlt' }
  }

  const qualification = qualifyTenant(tenantProfile, listing)
  if (!qualification.qualified) {
    return {
      ok: false,
      status: 403,
      code: 'NOT_QUALIFIED',
      message: 'Du erfüllst die Anforderungen für diese Wohnung noch nicht.',
      issues: qualification.reasons,
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
    return { ok: false, status: 409, code: 'ALREADY_APPLIED', message: 'Bereits beworben' }
  }

  const applicant = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, firstName: true, name: true, nickname: true },
  })
  if (!applicant?.email) {
    return { ok: false, status: 400, code: 'NO_EMAIL', message: 'Keine E-Mail im Konto' }
  }

  await prisma.rentalApplication.deleteMany({
    where: {
      rentalListingId,
      applicantUserId: userId,
      status: 'rejected',
    },
  })

  const applicantDisplay = applicant.nickname?.trim() || applicant.name?.trim() || 'Helvenda-Nutzer'
  const applicantFullName =
    `${tenantProfile.firstName} ${tenantProfile.lastName}`.trim() || applicantDisplay
  const addressLine = `${listing.address}, ${listing.zip} ${listing.city}`
  const applicantContactEmail = tenantProfile.applicationEmail?.trim() || applicant.email
  const applicantContactPhone = tenantProfile.contactPhone?.trim() || applicant.phone?.trim() || null

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
      return { ok: false, status: 409, code: 'ALREADY_APPLIED', message: 'Bereits beworben' }
    }
    throw e
  }

  const creditResult = tenantProfile.creditCheckResult

  const emailResults = await Promise.allSettled([
    sendRentalLandlordNewApplicationEmail({
      landlordEmail: listing.user.email,
      landlordUserId: listing.userId,
      landlordFirst: listing.user,
      listingId: listing.id,
      listingTitle: listing.title,
      applicantFullName,
      applicantContactPhone,
      applicantContactEmail,
      applicantMessage: message,
      requiresCreditCheck: listing.requiresCreditCheck,
      creditCheckResult: creditResult,
      employmentStatus: tenantProfile.employmentStatus,
      employer: tenantProfile.employer,
      monthlyIncomeCategory: tenantProfile.monthlyIncomeCategory,
      referenceName: tenantProfile.referenceName,
      referencePhone: tenantProfile.referencePhone,
    }),
    sendRentalApplicantSuccessEmail({
      applicantEmail: applicantContactEmail,
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
      console.error('[createQualifiedRentalApplication] E-Mail fehlgeschlagen', { index: i, reason: r.reason })
    }
  })

  return { ok: true, applicationId }
}
