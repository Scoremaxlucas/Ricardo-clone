/**
 * Verification helper functions
 * Single source of truth for seller verification status
 */

export type VerificationStatus = 'unverified' | 'pending' | 'approved' | 'rejected'

/**
 * Check if user can sell (is verified)
 * Users can sell as long as they are not blocked or explicitly rejected.
 * This enables immediate selling after registration while admin review remains possible.
 */
export function canSell(user: {
  verified?: boolean
  verificationStatus?: string | null
  isBlocked?: boolean
}): boolean {
  if (user.isBlocked) {
    return false
  }
  if (user.verified !== true) {
    return false
  }
  const status = user.verificationStatus?.toLowerCase()
  return status !== 'rejected'
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
