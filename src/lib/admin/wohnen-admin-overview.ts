import {
  CertificateStatus,
  CheckStatus,
  CreditCheckStatus,
  RentalApplicationStatus,
  RentalListingStatus,
} from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type WohnenAdminOverview = {
  activeListings: number
  archivedListings: number
  applicationsTotal: number
  applicationsLast7Days: number
  applicationsApproved: number
  applicationsPendingReview: number
  applicationsPendingCredit: number
  creditPendingManual: number
  activeCertificates: number
  needsExpiryReview: number
  listingsUrlConcern: number
  outboxPending: number
  outboxFailed: number
}

export async function getWohnenAdminOverview(): Promise<WohnenAdminOverview> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    activeListings,
    archivedListings,
    applicationsTotal,
    applicationsLast7Days,
    applicationsApproved,
    applicationsPendingReview,
    applicationsPendingCredit,
    creditPendingManual,
    activeCertificates,
    needsExpiryReview,
    listingsUrlConcern,
    outboxPending,
    outboxFailed,
  ] = await Promise.all([
    prisma.rentalListing.count({ where: { status: RentalListingStatus.active } }),
    prisma.rentalListing.count({ where: { status: RentalListingStatus.archived } }),
    prisma.rentalApplication.count(),
    prisma.rentalApplication.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.rentalApplication.count({ where: { status: RentalApplicationStatus.approved } }),
    prisma.rentalApplication.count({ where: { status: RentalApplicationStatus.pending_manual_review } }),
    prisma.rentalApplication.count({ where: { status: RentalApplicationStatus.pending_credit_check } }),
    prisma.tenantProfile.count({ where: { creditCheckStatus: CreditCheckStatus.PENDING_MANUAL_REVIEW } }),
    prisma.helvendaCertificate.count({
      where: { status: CertificateStatus.ACTIVE, expiresAt: { gt: now } },
    }),
    prisma.rentalListing.count({ where: { needsExpiryReview: true } }),
    prisma.rentalListing.count({
      where: {
        status: RentalListingStatus.active,
        OR: [
          { lastCheckStatus: CheckStatus.GONE },
          { lastCheckStatus: CheckStatus.UNREACHABLE },
          { urlUnreachableStreak: { gte: 2 } },
        ],
      },
    }),
    prisma.wohnenEmailOutbox.count({ where: { status: 'pending' } }),
    prisma.wohnenEmailOutbox.count({ where: { status: 'failed' } }),
  ])

  return {
    activeListings,
    archivedListings,
    applicationsTotal,
    applicationsLast7Days,
    applicationsApproved,
    applicationsPendingReview,
    applicationsPendingCredit,
    creditPendingManual,
    activeCertificates,
    needsExpiryReview,
    listingsUrlConcern,
    outboxPending,
    outboxFailed,
  }
}
