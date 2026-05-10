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
