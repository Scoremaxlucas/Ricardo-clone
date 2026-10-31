import { prisma } from '@/lib/prisma'
import { sendSicRevokedEmail } from '@/lib/sic/email'
import { recordSicEvent } from '@/lib/sic/events'
import { sicLog } from '@/lib/sic/log'

export { parseSicRevokeReason, SIC_REVOKE_REASONS } from '@/lib/sic/revoke-reasons'
import { parseSicRevokeReason } from '@/lib/sic/revoke-reasons'

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
    reasonLength: reason.length,
  })
  await recordSicEvent({
    kind: 'CERTIFICATE_REVOKED',
    certificateId: cert.id,
    email: cert.email,
    meta: { reason, reviewerId: opts.reviewerId },
  })

  try {
    await sendSicRevokedEmail({ email: cert.email, certificateCode: cert.certificateCode })
  } catch (err) {
    console.error('[sic/revoke] notification email', err)
  }

  return { ok: true, already: false, certificateCode: cert.certificateCode, email: cert.email }
}
