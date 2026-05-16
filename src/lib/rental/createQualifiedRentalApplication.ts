import { CertificateStatus, Prisma } from '@prisma/client'
import { enqueueTenantApplicationConfirmEmail } from '@/lib/wohnen/email-outbox'
import { sendRentalApplicantSuccessEmail, sendRentalLandlordNewApplicationEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { buildApplicantSummaryForLandlord } from '@/lib/rental/build-applicant-summary'
import { formatRentalListingAddress } from '@/lib/rental/format-listing-address'
import { qualifyTenant, type QualificationIssue } from '@/lib/rental/qualifyTenant'
import { resolveLandlordApplicationNotifyEmail } from '@/lib/rental/resolve-landlord-notify-email'

const REJECTION_NOTE_LANDLORD_MAIL_FAILED =
  '[Helvenda] Automatisch abgewiesen: Vermieter-Benachrichtigung konnte nicht versendet werden. Du kannst dich erneut bewerben.'

async function removeApplicationAfterFailedLandlordEmail(params: {
  applicationId: string
  rentalListingId: string
  applicantUserId: string
}): Promise<void> {
  const { applicationId, rentalListingId, applicantUserId } = params

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await prisma.rentalApplication.delete({ where: { id: applicationId } })
      return
    } catch (e) {
      console.warn('[createQualifiedRentalApplication] Rollback delete Versuch fehlgeschlagen', attempt + 1, e)
      await new Promise(r => setTimeout(r, 45 * (attempt + 1)))
    }
  }

  try {
    const del = await prisma.rentalApplication.deleteMany({
      where: { id: applicationId, rentalListingId, applicantUserId },
    })
    if (del.count > 0) return
  } catch (e) {
    console.error('[createQualifiedRentalApplication] Rollback deleteMany fehlgeschlagen', e)
  }

  const still = await prisma.rentalApplication.findUnique({
    where: { id: applicationId },
    select: { id: true },
  })
  if (!still) return

  try {
    await prisma.rentalApplication.update({
      where: { id: applicationId },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionNote: REJECTION_NOTE_LANDLORD_MAIL_FAILED,
      },
    })
    console.error(
      '[createQualifiedRentalApplication] Bewerbung nach fehlgeschlagenem Mail-Versand als rejected markiert (Delete nicht möglich)',
      { applicationId, rentalListingId, applicantUserId },
    )
  } catch (e) {
    console.error(
      '[createQualifiedRentalApplication] Kritischer Rollback-Fehler: weder delete noch rejected-Update möglich',
      { applicationId, rentalListingId, applicantUserId },
      e,
    )
  }
}

export type CreateRentalApplicationErrorCode =
  | 'LISTING_NOT_ACTIVE'
  | 'FORBIDDEN'
  | 'NO_PROFILE'
  | 'NOT_QUALIFIED'
  | 'ALREADY_APPLIED'
  | 'NO_EMAIL'
  | 'NO_LANDLORD_NOTIFY_EMAIL'
  /** Vermieter-Lead-Mail technisch fehlgeschlagen — Bewerbung wird zurückgerollt. */
  | 'LANDLORD_EMAIL_FAILED'

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
  landlordNotifyEmail: true,
  landlordContact: true,
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

  if (!listing) {
    return { ok: false, status: 404, code: 'LISTING_NOT_ACTIVE', message: 'Inserat nicht aktiv' }
  }

  const landlordNotifyTo = resolveLandlordApplicationNotifyEmail({
    landlordNotifyEmail: listing.landlordNotifyEmail,
    landlordContactStored: listing.landlordContact,
    ownerAccountEmail: listing.user?.email,
  })
  if (!landlordNotifyTo) {
    return {
      ok: false,
      status: 422,
      code: 'NO_LANDLORD_NOTIFY_EMAIL',
      message:
        'Für dieses Inserat ist keine gültige Vermieter-E-Mail hinterlegt. Bitte im Inserat eine Benachrichtigungs-Adresse setzen oder den internen Vermieter-Kontakt mit E-Mail pflegen.',
    }
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
  const addressLine = formatRentalListingAddress({
    address: listing.address,
    zip: listing.zip,
    city: listing.city,
  })
  const applicantSummary = buildApplicantSummaryForLandlord({
    employmentStatus: tenantProfile.employmentStatus,
    employer: tenantProfile.employer,
    jobTitle: tenantProfile.jobTitle,
    employedSince: tenantProfile.employedSince,
    monthlyIncomeCategory: tenantProfile.monthlyIncomeCategory,
    householdTotalPersons: tenantProfile.householdTotalPersons,
    householdChildrenCount: tenantProfile.householdChildrenCount,
    requiresCreditCheck: listing.requiresCreditCheck,
    creditCheckResult: tenantProfile.creditCheckResult,
  })
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
        landlordLeadEmail: landlordNotifyTo,
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

  const activeCert = await prisma.helvendaCertificate.findFirst({
    where: {
      tenantProfileId: tenantProfile.id,
      status: CertificateStatus.ACTIVE,
      expiresAt: { gt: new Date() },
    },
    orderBy: { issuedAt: 'desc' },
    select: { certificateCode: true },
  })

  try {
    await sendRentalLandlordNewApplicationEmail({
      landlordEmail: landlordNotifyTo,
      landlordUserId: listing.userId,
      landlordFirst: listing.user,
      listingId: listing.id,
      listingTitle: listing.title,
      applicantFullName,
      applicantContactPhone,
      applicantContactEmail,
      applicantMessage: message,
      applicantSummary,
      requiresCreditCheck: listing.requiresCreditCheck,
      creditCheckResult: creditResult,
      employmentStatus: tenantProfile.employmentStatus,
      employer: tenantProfile.employer,
      monthlyIncomeCategory: tenantProfile.monthlyIncomeCategory,
      referenceName: tenantProfile.referenceName,
      referencePhone: tenantProfile.referencePhone,
      certificateCode: activeCert?.certificateCode ?? null,
    })
  } catch (err) {
    await removeApplicationAfterFailedLandlordEmail({
      applicationId,
      rentalListingId,
      applicantUserId: userId,
    })
    console.error('[createQualifiedRentalApplication] Vermieter-Benachrichtigung fehlgeschlagen', err)
    return {
      ok: false,
      status: 503,
      code: 'LANDLORD_EMAIL_FAILED',
      message:
        'Die Benachrichtigung an den Vermieter konnte nicht versendet werden. Bitte versuche es in wenigen Minuten erneut. Eine gültige Bewerbung liegt nicht vor — du kannst es danach erneut versuchen.',
    }
  }

  try {
    await sendRentalApplicantSuccessEmail({
      applicantEmail: applicantContactEmail,
      applicantUserId: userId,
      applicantFirst: applicant,
      listingTitle: listing.title,
      addressLine,
      rooms: listing.rooms,
      rentPerMonth: listing.rentPerMonth,
    })
  } catch (err) {
    console.error(
      '[createQualifiedRentalApplication] Bestätigungs-Mail an Mieter fehlgeschlagen — Outbox für Retry (Vermieter wurde informiert)',
      err,
    )
    try {
      await enqueueTenantApplicationConfirmEmail({
        rentalApplicationId: applicationId,
        applicantUserId: userId,
        payload: {
          applicantEmail: applicantContactEmail,
          applicantUserId: userId,
          applicantFirst: applicant,
          listingTitle: listing.title,
          addressLine,
          rooms: listing.rooms,
          rentPerMonth: listing.rentPerMonth,
        },
      })
    } catch (enqueueErr) {
      console.error('[createQualifiedRentalApplication] Outbox enqueue Mieter-Mail fehlgeschlagen', enqueueErr)
    }
  }

  return { ok: true, applicationId }
}
