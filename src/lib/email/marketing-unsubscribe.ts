/**
 * Marketing Email Unsubscribe Tokens
 *
 * Email-based (not userId-based) tokens so imported contacts
 * without user accounts can also unsubscribe.
 */

import crypto from 'crypto'
import { getEmailBaseUrl } from './config'

const getSecret = () => process.env.NEXTAUTH_SECRET || 'marketing-fallback-secret'

export function generateMarketingUnsubscribeToken(email: string): string {
  const hmac = crypto.createHmac('sha256', getSecret())
  hmac.update(`marketing:${email.toLowerCase()}`)
  const signature = hmac.digest('hex')
  return Buffer.from(`${email.toLowerCase()}:${signature}`).toString('base64url')
}

export function verifyMarketingUnsubscribeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf-8')
    const colonIndex = decoded.indexOf(':')
    if (colonIndex === -1) return null

    const email = decoded.substring(0, colonIndex)
    const signature = decoded.substring(colonIndex + 1)

    const hmac = crypto.createHmac('sha256', getSecret())
    hmac.update(`marketing:${email}`)
    const expectedSignature = hmac.digest('hex')

    if (
      signature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      return null
    }

    return email
  } catch {
    return null
  }
}

export function getMarketingUnsubscribeUrl(email: string): string {
  const token = generateMarketingUnsubscribeToken(email)
  return `${getEmailBaseUrl()}/marketing/unsubscribe?token=${token}`
}
