/**
 * Verification helper functions
 * Single source of truth for seller verification status
 */

export type VerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected'

/**
 * Check if user can sell (is verified)
 * User must have verified=true AND verificationStatus='approved'
 */
export function canSell(user: {
  verified?: boolean
  verificationStatus?: string | null
  isBlocked?: boolean
}): boolean {
  if (user.isBlocked) {
    return false
  }
  return user.verified === true && user.verificationStatus === 'approved'
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
