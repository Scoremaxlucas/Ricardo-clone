import { CertificateStatus } from '@prisma/client'
import { buildApplicantSummaryForLandlord } from '@/lib/rental/build-applicant-summary'
import { findApplicationByLandlordLeadToken } from '@/lib/rental/landlord-lead-token'
import { prisma } from '@/lib/prisma'
import { formatRentalListingAddress } from '@/lib/rental/format-listing-address'
import { WOHNEN_SITE_ORIGIN } from '@/lib/site-urls'

export type LandlordLeadApplicationView = {
  applicationId: string
  createdAt: string
  status: string
  message: string | null
  rejectedAt: string | null
  viewingRequestedAt: string | null
  viewingDate: string | null
  landlordRespondedAt: string | null
  listing: {
    title: string
    addressLine: string
    rentPerMonth: number
  }
  applicant: {
    fullName: string
    contactPhone: string | null
    contactEmail: string | null
    summary: string | null
    employmentStatus: string
    employer: string | null
    incomeCategory: string
    referenceName: string | null
    referencePhone: string | null
    requiresCreditCheck: boolean
    creditCheckResult: unknown
  }
  certificateVerifyUrl: string | null
}

export async function loadLandlordLeadApplicationView(
  token: string
): Promise<LandlordLeadApplicationView | null> {
  const app = await findApplicationByLandlordLeadToken(token)
  if (!app?.tenantProfile) return null

  const applicantDisplay =
    app.applicant.nickname?.trim() || app.applicant.name?.trim() || 'Helvenda-Nutzer'
  const fullName =
    `${app.tenantProfile.firstName} ${app.tenantProfile.lastName}`.trim() || applicantDisplay

  const activeCert = await prisma.helvendaCertificate.findFirst({
    where: {
      tenantProfileId: app.tenantProfile.id,
      status: CertificateStatus.ACTIVE,
      expiresAt: { gt: new Date() },
    },
    orderBy: { issuedAt: 'desc' },
    select: { certificateCode: true },
  })

  const verifyUrl =
    activeCert?.certificateCode?.trim()
      ? `${WOHNEN_SITE_ORIGIN.replace(/\/$/, '')}/verify/${encodeURIComponent(activeCert.certificateCode.trim())}`
      : null

  return {
    applicationId: app.id,
    createdAt: app.createdAt.toISOString(),
    status: app.status,
    message: app.message,
    rejectedAt: app.rejectedAt?.toISOString() ?? null,
    viewingRequestedAt: app.viewingRequestedAt?.toISOString() ?? null,
    viewingDate: app.viewingDate?.toISOString() ?? null,
    landlordRespondedAt: app.landlordRespondedAt?.toISOString() ?? null,
    listing: {
      title: app.listing.title,
      addressLine: formatRentalListingAddress({
        address: app.listing.address,
        zip: app.listing.zip,
        city: app.listing.city,
      }),
      rentPerMonth: app.listing.rentPerMonth,
    },
    applicant: {
      fullName,
      contactPhone: app.tenantProfile.contactPhone?.trim() || app.applicant.phone?.trim() || null,
      contactEmail:
        app.tenantProfile.applicationEmail?.trim() || app.applicant.email?.trim() || null,
      summary: buildApplicantSummaryForLandlord({
        employmentStatus: app.tenantProfile.employmentStatus,
        employer: app.tenantProfile.employer,
        jobTitle: app.tenantProfile.jobTitle,
        employedSince: app.tenantProfile.employedSince,
        monthlyIncomeCategory: app.tenantProfile.monthlyIncomeCategory,
        householdTotalPersons: app.tenantProfile.householdTotalPersons,
        householdChildrenCount: app.tenantProfile.householdChildrenCount,
        currentHousingSituation: app.tenantProfile.currentHousingSituation,
        currentHousingSince: app.tenantProfile.currentHousingSince,
        requiresCreditCheck: app.listing.requiresCreditCheck,
        creditCheckResult: app.tenantProfile.creditCheckResult,
      }),
      employmentStatus: app.tenantProfile.employmentStatus,
      employer: app.tenantProfile.employer,
      incomeCategory: app.tenantProfile.monthlyIncomeCategory,
      referenceName: app.tenantProfile.referenceName,
      referencePhone: app.tenantProfile.referencePhone,
      requiresCreditCheck: app.listing.requiresCreditCheck,
      creditCheckResult: app.tenantProfile.creditCheckResult,
    },
    certificateVerifyUrl: verifyUrl,
  }
}
