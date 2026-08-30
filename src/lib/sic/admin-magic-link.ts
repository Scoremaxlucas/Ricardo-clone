import { prisma } from '@/lib/prisma'
import { sendSicMagicLinkEmail } from '@/lib/sic/email'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'

export type ResendSicMagicLinkResult =
  | { ok: true; email: string }
  | { ok: false; code: 'NOT_FOUND' | 'SEND_FAILED' }

/**
 * Support: neuer Workspace-Anmeldelink an die Zertifikats-E-Mail.
 * Der Token geht nur in die Mail, nicht an den Admin zurück.
 */
export async function resendSicWorkspaceMagicLink(opts: {
  certificateId: string
  reviewerId: string
}): Promise<ResendSicMagicLinkResult> {
  const cert = await prisma.sicCertificate.findUnique({
    where: { id: opts.certificateId },
    select: { id: true, email: true, certificateCode: true },
  })
  if (!cert) return { ok: false, code: 'NOT_FOUND' }

  try {
    const { url } = await createSicMagicLink(cert.email)
    await sendSicMagicLinkEmail(cert.email, url, 'support')
  } catch (err) {
    sicLog('sic.admin.magic_link_failed', {
      certificateId: cert.id,
      reviewerId: opts.reviewerId,
    })
    console.error('[sic/admin/magic-link] send failed', err)
    return { ok: false, code: 'SEND_FAILED' }
  }

  sicLog('sic.admin.magic_link', {
    certificateId: cert.id,
    certificateCode: cert.certificateCode,
    reviewerId: opts.reviewerId,
  })
  return { ok: true, email: cert.email }
}
