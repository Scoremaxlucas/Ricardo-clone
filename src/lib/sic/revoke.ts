import { prisma } from '@/lib/prisma'
import { recordSicEvent } from '@/lib/sic/events'
import { sicLog } from '@/lib/sic/log'

export function parseSicRevokeReason(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const note = raw.trim().slice(0, 1000)
  return note.length >= 8 ? note : null
}

export const SIC_REVOKE_REASONS = [
  'Gefälschte Unterlagen',
  'Fremde Unterlagen',
  'Sonstiger schwerer Missbrauch',
] as const

export type SicRevokeResult =
  | { ok: true; already: boolean; certificateCode: string; email: string }
  | { ok: false; reason: 'NOT_FOUND' }

/**
 * AGB §8: Widerruf ohne Rückerstattung. Zahlungen bleiben PAID.
 * Die Prüfseite zeigt den Code danach als widerrufen, ohne Personendaten.
 */
export async function revokeSicCertificate(opts: {
  certificateId: string
  reviewerId: string
  reason: string
}): Promise<SicRevokeResult> {
  const reason = parseSicRevokeReason(opts.reason)
  if (!reason) return { ok: false, reason: 'NOT_FOUND' }

  const cert = await prisma.sicCertificate.findUnique({
    where: { id: opts.certificateId },
    select: { id: true, email: true, certificateCode: true, status: true },
  })
  if (!cert) return { ok: false, reason: 'NOT_FOUND' }

  if (cert.status === 'REVOKED') {
    return { ok: true, already: true, certificateCode: cert.certificateCode, email: cert.email }
  }

  await prisma.sicCertificate.update({
    where: { id: cert.id },
    data: { status: 'REVOKED' },
  })

  sicLog('sic.admin.revoked', {
    certificateId: cert.id,
    reviewerId: opts.reviewerId,
    reason,
  })
  await recordSicEvent({
    kind: 'CERTIFICATE_REVOKED',
    certificateId: cert.id,
    email: cert.email,
    meta: { reason, reviewerId: opts.reviewerId },
  })

  return { ok: true, already: false, certificateCode: cert.certificateCode, email: cert.email }
}
