import { decryptLandlordContactFromStorage } from '@/lib/rental/pdf-crypto'

const EMAIL_IN_TEXT = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g

/** Einfache RFC-ähnliche Prüfung für Vermieter-Benachrichtigungen. */
export function normalizeAndValidateLandlordNotifyEmail(raw: string | null | undefined): string | null {
  const t = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  if (!t || t.length > 254) return null
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null
  return t
}

function isDisposableOrSystemLocalPart(local: string): boolean {
  const l = local.split('+')[0]?.toLowerCase() ?? ''
  return /^(noreply|no-reply|donotreply|mailer-daemon|postmaster|bounce|bounces)$/.test(l)
}

/**
 * Mehrere Adressen im Freitext: zuletzt genannte **nicht-System**-Adresse bevorzugen (oft Signatur);
 * reine noreply-Adressen werden übersprungen, sofern eine Alternative existiert.
 */
export function extractBestEmailFromPlaintext(text: string): string | null {
  const matches = text.match(EMAIL_IN_TEXT)
  if (!matches?.length) return null
  const normalized: string[] = []
  for (const m of matches) {
    const v = normalizeAndValidateLandlordNotifyEmail(m)
    if (v) normalized.push(v)
  }
  if (!normalized.length) return null
  const preferred = normalized.filter(v => {
    const local = v.split('@')[0] ?? ''
    return !isDisposableOrSystemLocalPart(local)
  })
  const pool = preferred.length ? preferred : normalized
  return pool[pool.length - 1] ?? null
}

/**
 * E-Mail für Bewerbungs-Benachrichtigungen:
 * 1) `landlordNotifyEmail` am Inserat
 * 2) beste gültige Adresse aus entschlüsseltem `landlordContact` (siehe `extractBestEmailFromPlaintext`)
 * 3) Konto-E-Mail des Inserats-Inhabers
 */
export function resolveLandlordApplicationNotifyEmail(input: {
  landlordNotifyEmail: string | null | undefined
  landlordContactStored: string | null | undefined
  ownerAccountEmail: string | null | undefined
}): string | null {
  const direct = normalizeAndValidateLandlordNotifyEmail(input.landlordNotifyEmail ?? null)
  if (direct) return direct

  const decrypted = decryptLandlordContactFromStorage(input.landlordContactStored ?? null)
  if (decrypted) {
    const extracted = extractBestEmailFromPlaintext(decrypted)
    if (extracted) return extracted
  }

  return normalizeAndValidateLandlordNotifyEmail(input.ownerAccountEmail ?? null)
}

const PHONE_LINE = /^(\+41|0\d|tel\.?|telefon|mobile|ruf|phone)\b/i
const CONTACT_LABEL = /^(name|kontakt|contact|vermieter|ansprechpartner)\s*:\s*/i

/** Erster sinnvoller Name aus Freitext-Kontakt (ohne E-Mail-/Telefonzeilen). */
export function extractLandlordSalutationFromPlaintext(text: string): string | null {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const skipTitles = /^(frau|herr|mr|mrs|ms|dr|prof)\.?$/i

  for (const line of lines) {
    if (PHONE_LINE.test(line)) continue
    let withoutEmails = line.replace(EMAIL_IN_TEXT, '').trim()
    const labelMatch = withoutEmails.match(CONTACT_LABEL)
    if (labelMatch) withoutEmails = withoutEmails.slice(labelMatch[0].length).trim()
    if (!withoutEmails || /^null$/i.test(withoutEmails)) continue
    const emails = line.match(EMAIL_IN_TEXT)
    if (!withoutEmails && emails?.length) continue

    const parts = withoutEmails.split(/\s+/).filter(Boolean)
    let i = 0
    while (i < parts.length && skipTitles.test(parts[i] ?? '')) i++
    const candidate = parts[i]
    if (!candidate || candidate.length < 2 || candidate.includes('@')) continue
    if (/^\d+$/.test(candidate)) continue
    return candidate
  }
  return null
}

/** Inserat-Inhaber ist Helvenda-intern (Admin-Import) — kein Vermieter-Login auf /matching. */
export function isHelvendaInternalListingOwnerEmail(email: string | null | undefined): boolean {
  const e = normalizeAndValidateLandlordNotifyEmail(email ?? null)
  return e !== null && e.endsWith('@helvenda.ch')
}

function isHelvendaInternalOwnerEmail(email: string | null | undefined): boolean {
  return isHelvendaInternalListingOwnerEmail(email)
}

/**
 * Vorname für «Hallo …» in der Vermieter-Mail — nicht das Plattform-Admin-Konto bei importierten Inseraten.
 */
export function resolveLandlordSalutationFirstName(input: {
  landlordNotifyEmail: string | null | undefined
  landlordContactStored: string | null | undefined
  ownerAccount: { firstName?: string | null; name?: string | null; email?: string | null } | null | undefined
}): string | null {
  const decrypted = decryptLandlordContactFromStorage(input.landlordContactStored ?? null)
  if (decrypted) {
    const fromContact = extractLandlordSalutationFromPlaintext(decrypted)
    if (fromContact) return fromContact
  }

  if (isHelvendaInternalOwnerEmail(input.ownerAccount?.email)) {
    return null
  }

  const fn = input.ownerAccount?.firstName?.trim()
  if (fn && fn.toLowerCase() !== 'admin') return fn.split(/\s+/)[0] ?? fn

  const full = input.ownerAccount?.name?.trim()
  if (full && full.toLowerCase() !== 'admin') {
    const first = full.split(/\s+/)[0]
    if (first && first.length >= 2) return first
  }

  return null
}

/** Gespeicherte Lead-E-Mail oder aktuelle Auflösung vom Inserat (für ältere Bewerbungen). */
export function landlordLeadEmailForApplication(args: {
  landlordLeadEmail: string | null | undefined
  listing: {
    landlordNotifyEmail: string | null | undefined
    landlordContact: string | null | undefined
    user?: { email: string | null | undefined } | null
  }
}): string | null {
  const stored = normalizeAndValidateLandlordNotifyEmail(args.landlordLeadEmail ?? null)
  if (stored) return stored
  return resolveLandlordApplicationNotifyEmail({
    landlordNotifyEmail: args.listing.landlordNotifyEmail,
    landlordContactStored: args.listing.landlordContact,
    ownerAccountEmail: args.listing.user?.email,
  })
}
