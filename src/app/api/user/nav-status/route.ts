import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { creditApprovedValid } from '@/lib/wohnenTenantJourney'
import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export type NavStatusJson = {
  profileComplete: boolean
  creditCheckStatus: string
  creditCheckExpiresAt: string | null
  creditApprovedAndValid: boolean
  creditPendingReview: boolean
  hasActiveCertificate: boolean
  certificateCode: string | null
  certificateExpiresAt: string | null
  hasListings: boolean
  openApplicationsCount: number
  newInquiriesCount: number
  isAdmin: boolean
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 })
  }

  const now = new Date()

  const [user, profile, certificate, listingsCount, openApplicationsCount, newInquiriesCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      }),
      prisma.tenantProfile.findUnique({
        where: { userId },
        select: { isComplete: true, creditCheckStatus: true, creditCheckExpiresAt: true },
      }),
      prisma.helvendaCertificate.findFirst({
        where: { userId, status: 'ACTIVE', expiresAt: { gt: now } },
        orderBy: { issuedAt: 'desc' },
        select: { certificateCode: true, expiresAt: true },
      }),
      prisma.rentalListing.count({
        where: { userId, status: 'active' },
      }),
      prisma.rentalApplication.count({
        where: {
          applicantUserId: userId,
          status: { in: ['approved', 'pending_credit_check', 'pending_manual_review'] },
        },
      }),
      prisma.rentalApplication.count({
        where: {
          status: { in: ['pending_credit_check', 'pending_manual_review'] },
          listing: { userId, status: 'active' },
        },
      }),
    ])

  const exp = profile?.creditCheckExpiresAt
  const creditApprovedAndValid = creditApprovedValid(
    profile ?
      { creditCheckStatus: profile.creditCheckStatus, creditCheckExpiresAt: exp ?? null }
    : null,
    now
  )
  const creditPendingReview = Boolean(
    profile?.creditCheckStatus === 'PENDING' ||
      profile?.creditCheckStatus === 'PENDING_MANUAL_REVIEW'
  )

  const body: NavStatusJson = {
    profileComplete: profile?.isComplete ?? false,
    creditCheckStatus: profile?.creditCheckStatus ?? 'NONE',
    creditCheckExpiresAt: exp?.toISOString() ?? null,
    creditApprovedAndValid,
    creditPendingReview,
    hasActiveCertificate: Boolean(certificate),
    certificateCode: certificate?.certificateCode ?? null,
    certificateExpiresAt: certificate?.expiresAt.toISOString() ?? null,
    hasListings: listingsCount > 0,
    openApplicationsCount,
    newInquiriesCount,
    isAdmin: user?.isAdmin === true,
  }

  return NextResponse.json(body)
}
