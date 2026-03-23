/**
 * Verification helper functions
 * Single source of truth for seller verification status
 */

export type VerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected'

/**
 * True if the user has completed the seller identity upload (matches /api/verification/submit rules).
 * After admin approval, documents may be deleted — use verificationStatus === 'approved' in canSell.
 */
export function hasSellerIdentityDocumentsSubmitted(user: {
  idDocument?: string | null
  idDocumentPage1?: string | null
  idDocumentPage2?: string | null
  idDocumentType?: string | null
}): boolean {
  const type = user.idDocumentType
  if (type !== 'ID' && type !== 'Passport') {
    return false
  }
  if (type === 'ID') {
    return !!(user.idDocumentPage1 || user.idDocumentPage2)
  }
  return !!user.idDocument
}

/**
 * Prisma where clause: pending queue for admin (submitted ID, awaiting review).
 * Keep in sync with hasSellerIdentityDocumentsSubmitted + pending status.
 */
export const prismaWherePendingSellerVerificationReview = {
  verificationStatus: 'pending' as const,
  verified: true,
  idDocumentType: { in: ['ID', 'Passport'] },
  OR: [
    { idDocument: { not: null } },
    { idDocumentPage1: { not: null } },
    { idDocumentPage2: { not: null } },
  ],
}

/**
 * Check if user can sell listings.
 * - Approved sellers can always sell (documents may have been removed after review).
 * - Pending sellers must have submitted identity documents (Ausweis/Pass).
 * - Rejected or blocked users cannot sell.
 */
export function canSell(user: {
  verified?: boolean
  verificationStatus?: string | null
  isBlocked?: boolean
  idDocument?: string | null
  idDocumentPage1?: string | null
  idDocumentPage2?: string | null
  idDocumentType?: string | null
}): boolean {
  if (user.isBlocked) {
    return false
  }
  if (user.verified !== true) {
    return false
  }
  const status = user.verificationStatus?.toLowerCase()
  if (status === 'rejected') {
    return false
  }
  if (status === 'approved') {
    return true
  }
  // pending (or unknown): require submitted identity docs before selling
  return hasSellerIdentityDocumentsSubmitted(user)
}

/**
 * Get verification status from user object
 */
export function getVerificationStatus(user: {
  verified?: boolean
  verificationStatus?: string | null
}): VerificationStatus {
  if (!user.verified) {
    return 'unverified'
  }

  const status = user.verificationStatus?.toLowerCase()
  if (status === 'approved') {
    return 'approved'
  }
  if (status === 'pending') {
    return 'pending'
  }
  if (status === 'rejected') {
    return 'rejected'
  }

  // Default to unverified if verified=true but status is unclear
  return user.verified ? 'pending' : 'unverified'
}
