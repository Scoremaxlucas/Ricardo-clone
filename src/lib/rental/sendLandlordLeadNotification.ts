import { CertificateStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { buildApplicantSummaryForLandlord } from '@/lib/rental/build-applicant-summary'
import { sendRentalLandlordNewApplicationEmail } from '@/lib/rental/emails'
import {
  isHelvendaInternalListingOwnerEmail,
  resolveLandlordApplicationNotifyEmail,
  resolveLandlordSalutationFirstName,
} from '@/lib/rental/resolve-landlord-notify-email'
import {
  isWohnenLeadEmailOverrideVerbose,
  resolveWohnenLeadDelivery,
} from '@/lib/rental/wohnen-lead-email-override'

export type SendLandlordLeadNotificationResult =
  | { ok: true; deliveredTo: string; intendedTo: string; isOverride: boolean }
  | { ok: false; message: string }

/**
 * Vermieter-Lead-Mail (Template «Neue Bewerbung») — inkl. WOHNEN_LEAD_EMAIL_OVERRIDE.
 */
export async function sendLandlordLeadNotificationForApplication(
  applicationId: string
): Promise<SendLandlordLeadNotificationResult> {
  const app = await prisma.rentalApplication.findUnique({
    where: { id: applicationId },
    include: {
      listing: {
        select: {
          id: true,
          userId: true,
          title: true,
          requiresCreditCheck: true,
          landlordNotifyEmail: true,
          landlordContact: true,
          user: { select: { id: true, email: true, firstName: true, name: true } },
        },
      },
      tenantProfile: true,
      applicant: { select: { email: true, phone: true, firstName: true, name: true, nickname: true } },
    },
  })

  if (!app) return { ok: false, message: 'Bewerbung nicht gefunden' }
  if (!app.tenantProfile) return { ok: false, message: 'Kein Mieterprofil' }

  const intendedTo =
    app.landlordLeadEmail?.trim() ||
    resolveLandlordApplicationNotifyEmail({
      landlordNotifyEmail: app.listing.landlordNotifyEmail,
      landlordContactStored: app.listing.landlordContact,
      ownerAccountEmail: app.listing.user?.email,
    })

  if (!intendedTo) {
    return { ok: false, message: 'Keine gültige Vermieter-E-Mail am Inserat' }
  }

  const delivery = resolveWohnenLeadDelivery(intendedTo)
  if (delivery.isOverride) {
    console.info('[wohnen-lead] Test-Override aktiv — Lead-Mail an', delivery.to, 'statt', intendedTo)
  }

  const applicantDisplay =
    app.applicant.nickname?.trim() || app.applicant.name?.trim() || 'Helvenda-Nutzer'
  const applicantFullName =
    `${app.tenantProfile.firstName} ${app.tenantProfile.lastName}`.trim() || applicantDisplay
  const applicantContactEmail =
    app.tenantProfile.applicationEmail?.trim() || app.applicant.email?.trim() || null
  const applicantContactPhone =
    app.tenantProfile.contactPhone?.trim() || app.applicant.phone?.trim() || null

  const applicantSummary = buildApplicantSummaryForLandlord({
    employmentStatus: app.tenantProfile.employmentStatus,
    employer: app.tenantProfile.employer,
    jobTitle: app.tenantProfile.jobTitle,
    employedSince: app.tenantProfile.employedSince,
    monthlyIncomeCategory: app.tenantProfile.monthlyIncomeCategory,
    householdTotalPersons: app.tenantProfile.householdTotalPersons,
    householdChildrenCount: app.tenantProfile.householdChildrenCount,
    requiresCreditCheck: app.listing.requiresCreditCheck,
    creditCheckResult: app.tenantProfile.creditCheckResult,
  })

  const activeCert = await prisma.helvendaCertificate.findFirst({
    where: {
      tenantProfileId: app.tenantProfile.id,
      status: CertificateStatus.ACTIVE,
      expiresAt: { gt: new Date() },
    },
    orderBy: { issuedAt: 'desc' },
    select: { certificateCode: true },
  })

  const salutationFirst = resolveLandlordSalutationFirstName({
    landlordNotifyEmail: app.listing.landlordNotifyEmail,
    landlordContactStored: app.listing.landlordContact,
    ownerAccount: app.listing.user,
  })

  try {
    await sendRentalLandlordNewApplicationEmail({
      landlordEmail: delivery.to,
      leadTestIntendedEmail:
        delivery.isOverride && isWohnenLeadEmailOverrideVerbose() ? delivery.intendedEmail : null,
      landlordUserId: app.listing.userId,
      landlordSalutationFirstName: salutationFirst,
      listingId: app.listing.id,
      listingTitle: app.listing.title,
      applicantFullName,
      applicantContactPhone,
      applicantContactEmail,
      applicantMessage: app.message,
      applicantSummary,
      requiresCreditCheck: app.listing.requiresCreditCheck,
      creditCheckResult: app.tenantProfile.creditCheckResult,
      employmentStatus: app.tenantProfile.employmentStatus,
      employer: app.tenantProfile.employer,
      monthlyIncomeCategory: app.tenantProfile.monthlyIncomeCategory,
      referenceName: app.tenantProfile.referenceName,
      referencePhone: app.tenantProfile.referencePhone,
      certificateCode: activeCert?.certificateCode ?? null,
      landlordCanViewOnPlatform: !isHelvendaInternalListingOwnerEmail(app.listing.user?.email),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'E-Mail-Versand fehlgeschlagen'
    console.error('[sendLandlordLeadNotification] Versand fehlgeschlagen', { applicationId, to: delivery.to, err })
    return { ok: false, message: msg }
  }

  try {
    await prisma.rentalApplication.update({
      where: { id: applicationId },
      data: {
        landlordLeadEmail: intendedTo,
        landlordLeadEmailDeliveredTo: delivery.to,
      },
    })
  } catch (e) {
    console.warn('[sendLandlordLeadNotification] Zustelladresse konnte nicht gespeichert werden', e)
  }

  return { ok: true, deliveredTo: delivery.to, intendedTo, isOverride: delivery.isOverride }
}
