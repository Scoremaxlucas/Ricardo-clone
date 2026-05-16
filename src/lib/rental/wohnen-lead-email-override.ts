import { normalizeAndValidateLandlordNotifyEmail } from '@/lib/rental/resolve-landlord-notify-email'

/**
 * Test-Modus: alle Vermieter-Lead-Mails an diese Adresse (statt an den echten Vermieter).
 * Aktivieren: `WOHNEN_LEAD_EMAIL_OVERRIDE=lucas.helvenda@outlook.com` in .env / Vercel.
 * Deaktivieren: Variable entfernen oder leeren und neu deployen.
 */
export function getWohnenLeadEmailOverride(): string | null {
  return normalizeAndValidateLandlordNotifyEmail(process.env.WOHNEN_LEAD_EMAIL_OVERRIDE)
}

export function isWohnenLeadEmailOverrideActive(): boolean {
  return getWohnenLeadEmailOverride() !== null
}

/** Banner/Betreff-[TEST] nur wenn explizit gewünscht (Standard: stille Weiterleitung, authentische Mail). */
export function isWohnenLeadEmailOverrideVerbose(): boolean {
  const v = process.env.WOHNEN_LEAD_EMAIL_OVERRIDE_VERBOSE?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function resolveWohnenLeadDelivery(intendedEmail: string): {
  to: string
  intendedEmail: string
  isOverride: boolean
} {
  const intended = normalizeAndValidateLandlordNotifyEmail(intendedEmail) ?? intendedEmail.trim().toLowerCase()
  const override = getWohnenLeadEmailOverride()
  if (override) {
    return { to: override, intendedEmail: intended, isOverride: true }
  }
  return { to: intended, intendedEmail: intended, isOverride: false }
}
