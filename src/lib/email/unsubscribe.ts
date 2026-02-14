/**
 * Email Unsubscribe Token Utilities
 *
 * Generates and verifies signed tokens for one-click email unsubscribe.
 * No login required — the token is a HMAC of userId signed with NEXTAUTH_SECRET.
 */

import crypto from 'crypto'
import { getEmailBaseUrl } from './config'

const getSecret = () => process.env.NEXTAUTH_SECRET || ''

/**
 * Generate a signed unsubscribe token for a user
 */
export function generateUnsubscribeToken(userId: string): string {
  const hmac = crypto.createHmac('sha256', getSecret())
  hmac.update(userId)
  const signature = hmac.digest('hex')
  // Token = base64(userId:signature)
  return Buffer.from(`${userId}:${signature}`).toString('base64url')
}

/**
 * Verify and decode an unsubscribe token
 * Returns the userId if valid, null if invalid
 */
export function verifyUnsubscribeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const colonIndex = decoded.indexOf(':')
    if (colonIndex === -1) return null

    const userId = decoded.substring(0, colonIndex)
    const signature = decoded.substring(colonIndex + 1)

    // Regenerate the expected signature
    const hmac = crypto.createHmac('sha256', getSecret())
    hmac.update(userId)
    const expectedSignature = hmac.digest('hex')

    // Constant-time comparison to prevent timing attacks
    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null
    }

    return userId
  } catch {
    return null
  }
}

/**
 * Generate an unsubscribe URL for a user
 */
export function getUnsubscribeUrl(userId: string): string {
  const token = generateUnsubscribeToken(userId)
  return `${getEmailBaseUrl()}/unsubscribe?token=${token}`
}
