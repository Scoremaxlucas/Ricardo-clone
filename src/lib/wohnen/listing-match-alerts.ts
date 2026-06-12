import { CertificateStatus } from '@prisma/client'
import { evaluateMatch } from '@/lib/matching/evaluate-match'
import {
  hasAnyTenantPreferences,
  tenantPreferencesToSeekerInput,
} from '@/lib/matching/tenant-preferences-match'
import { sendTenantNewListingMatchEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'
import { formatRentalListingAddress } from '@/lib/rental/format-listing-address'

const LOOKBACK_HOURS = 26

export type ListingMatchAlertRunResult = {
  listingsScanned: number
  alertsSent: number
  errors: string[]
}

/**
 * Täglicher Cron: neue aktive Inserate → passende Mieterprofile per E-Mail benachrichtigen.
 */
export async function runListingMatchAlerts(): Promise<ListingMatchAlertRunResult> {
  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000)
  const errors: string[] = []
  let alertsSent = 0

  const listings = await prisma.rentalListing.findMany({
    where: {
      status: 'active',
      createdAt: { gte: since },
    },
    select: {
      id: true,
      title: true,
      address: true,
      zip: true,
      city: true,
      canton: true,
      rooms: true,
      rentPerMonth: true,
      utilitiesPerMonth: true,
      availableFrom: true,
    },
    take: 50,
  })

  if (listings.length === 0) {
    return { listingsScanned: 0, alertsSent: 0, errors }
  }

  const profiles = await prisma.tenantProfile.findMany({
    where: {
      isComplete: true,
      listingMatchAlertsEnabled: true,
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, name: true } },
    },
    take: 500,
  })

  for (const listing of listings) {
    const propertyInput = {
      id: listing.id,
      canton: listing.canton,
      zip: listing.zip,
      rooms: Number(listing.rooms),
      rentPerMonth: listing.rentPerMonth,
      availableFrom: listing.availableFrom,
      status: 'active' as const,
    }

    for (const profile of profiles) {
      if (!hasAnyTenantPreferences(profile)) continue
      if (!profile.user.email) continue

      const match = evaluateMatch(tenantPreferencesToSeekerInput(profile), propertyInput, {})
      if (match.hardFailed) continue

      const alreadyApplied = await prisma.rentalApplication.findFirst({
        where: {
          rentalListingId: listing.id,
          applicantUserId: profile.userId,
          status: { in: ['pending_credit_check', 'pending_manual_review', 'approved'] },
        },
        select: { id: true },
      })
      if (alreadyApplied) continue

      const alreadyAlerted = await prisma.wohnenListingMatchAlert.findUnique({
        where: {
          tenantProfileId_rentalListingId: {
            tenantProfileId: profile.id,
            rentalListingId: listing.id,
          },
        },
      })
      if (alreadyAlerted) continue

      const activeCert = await prisma.helvendaCertificate.findFirst({
        where: {
          tenantProfileId: profile.id,
          status: CertificateStatus.ACTIVE,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      })
      if (!activeCert) continue

      const addressLine = formatRentalListingAddress({
        address: listing.address,
        zip: listing.zip,
        city: listing.city,
      })
      const totalRent = listing.rentPerMonth + (listing.utilitiesPerMonth ?? 0)

      try {
        await sendTenantNewListingMatchEmail({
          tenantEmail: profile.user.email,
          tenantUserId: profile.userId,
          tenantFirst: profile.user,
          listingTitle: listing.title,
          listingId: listing.id,
          addressLine,
          rooms: Number(listing.rooms),
          rentPerMonth: totalRent,
        })
        await prisma.wohnenListingMatchAlert.create({
          data: {
            tenantProfileId: profile.id,
            rentalListingId: listing.id,
          },
        })
        alertsSent++
      } catch (e) {
        errors.push(`${profile.userId}/${listing.id}: ${e instanceof Error ? e.message : 'error'}`)
      }
    }
  }

  return { listingsScanned: listings.length, alertsSent, errors }
}
