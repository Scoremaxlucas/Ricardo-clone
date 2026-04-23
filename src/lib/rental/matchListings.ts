import type { RentalListing, TenantProfile } from '@prisma/client'
import { parsePostalCodesList } from '@/lib/matching/evaluate-match'
import { INCOME_MINIMUMS, qualifyTenant } from '@/lib/rental/qualifyTenant'

export type MatchResultRow = {
  listing: RentalListing
  score: number
  highlights: string[]
}

export type MatchEmptyReason =
  | 'INCOME_BLOCKED'
  | 'CANTON_RESTRICTED'
  | 'CREDIT_CHECK_REQUIRED'
  | 'NO_MATCHES'

export type MatchListingsResult = {
  matches: MatchResultRow[]
  emptyReason: MatchEmptyReason | null
}

function daysSinceCreated(createdAt: Date): number {
  return (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000)
}

function scoreListing(profile: TenantProfile, listing: RentalListing): MatchResultRow {
  const totalRent = listing.rentPerMonth + (listing.utilitiesPerMonth ?? 0)
  const monthlyIncome = INCOME_MINIMUMS[profile.monthlyIncomeCategory] ?? 0
  let score = 50
  const highlights: string[] = []

  const incomeRatio = totalRent > 0 ? monthlyIncome / totalRent : 0
  if (incomeRatio >= 5) score += 20
  else if (incomeRatio >= 4) score += 15
  else if (incomeRatio >= 3.5) score += 10

  if (profile.preferredCanton && listing.canton === profile.preferredCanton) {
    score += 20
    highlights.push('Kanton passt')
  }

  const roomsFits =
    (profile.preferredMinRooms == null || listing.rooms + 1e-9 >= profile.preferredMinRooms) &&
    (profile.preferredMaxRooms == null || listing.rooms - 1e-9 <= profile.preferredMaxRooms)
  if (roomsFits && (profile.preferredMinRooms != null || profile.preferredMaxRooms != null)) {
    score += 15
    highlights.push('Zimmerzahl passt')
  }

  if (profile.creditCheckStatus === 'APPROVED') {
    score += 10
    highlights.push('Betreibungsregisterauszug gültig')
  }

  if (daysSinceCreated(listing.createdAt) <= 7) {
    score += 5
    highlights.push('Neu inseriert')
  }

  if (profile.preferredBudgetMax != null && totalRent <= profile.preferredBudgetMax) {
    score += 8
    highlights.push('Im Budget')
  }
  if (profile.preferredBudgetMin != null && totalRent >= profile.preferredBudgetMin) {
    score += 4
  }

  const zips = parsePostalCodesList(profile.preferredPostalCodes)
  if (zips.length > 0 && zips.includes(listing.zip)) {
    score += 8
    highlights.push('PLZ passt')
  }

  if (profile.preferredMoveInEarliest && listing.availableFrom >= profile.preferredMoveInEarliest) {
    score += 4
  }
  if (profile.preferredMoveInLatest && listing.availableFrom <= profile.preferredMoveInLatest) {
    score += 6
    highlights.push('Einzug passt')
  }

  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    listing,
    score,
    highlights: highlights.slice(0, 3),
  }
}

export function matchListings(profile: TenantProfile, listings: RentalListing[]): MatchListingsResult {
  const active = listings.filter(l => l.status === 'active')

  const incomeBlocked = active.filter(l =>
    qualifyTenant(profile, { rentPerMonth: l.rentPerMonth, utilitiesPerMonth: l.utilitiesPerMonth }).reasons.some(
      r => r.code === 'INCOME_TOO_LOW'
    )
  )
  if (active.length > 0 && incomeBlocked.length === active.length) {
    return { matches: [], emptyReason: 'INCOME_BLOCKED' }
  }

  const hardFiltered = active.filter(listing => {
    const q = qualifyTenant(profile, { rentPerMonth: listing.rentPerMonth, utilitiesPerMonth: listing.utilitiesPerMonth })
    const incomeQualified = !q.reasons.some(r => r.code === 'INCOME_TOO_LOW')
    const creditCheckOk = !listing.requiresCreditCheck || profile.creditCheckStatus === 'APPROVED'
    const kantonMatch = !profile.preferredCanton || listing.canton === profile.preferredCanton
    return incomeQualified && creditCheckOk && kantonMatch
  })

  if (hardFiltered.length === 0) {
    if (profile.creditCheckStatus !== 'APPROVED' && active.some(l => l.requiresCreditCheck)) {
      return { matches: [], emptyReason: 'CREDIT_CHECK_REQUIRED' }
    }
    if (profile.preferredCanton) {
      return { matches: [], emptyReason: 'CANTON_RESTRICTED' }
    }
    return { matches: [], emptyReason: 'NO_MATCHES' }
  }

  const matches = hardFiltered
    .map(listing => scoreListing(profile, listing))
    .sort((a, b) => b.score - a.score || b.listing.createdAt.getTime() - a.listing.createdAt.getTime())

  return { matches, emptyReason: null }
}
