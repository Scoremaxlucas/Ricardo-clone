import { prisma } from '@/lib/prisma'
import { generateSicCertificateCode } from '@/lib/sic/certificate-code'
import { sendSicMagicLinkEmail } from '@/lib/sic/email'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { sicExtendedExpiresAt, sicValidityExpiresAt } from '@/lib/sic/validity'
import type { SicModuleKind } from '@prisma/client'

export type FulfillResult =
  | { ok: true; certificateId: string; certificateCode: string; email: string; alreadyDone: boolean }
  | { ok: false; reason: string }

/** Zerlegt einen frei eingegebenen Namen in Vor-/Nachname (erstes Token = Vorname, Rest = Nachname). */
function splitHolderName(raw?: string | null): { firstName: string; lastName: string } | null {
  const cleaned = (raw ?? '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return null
  const parts = cleaned.split(' ')
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

async function ensureUniqueCode(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = generateSicCertificateCode()
    const exists = await prisma.sicCertificate.findUnique({
      where: { certificateCode: code },
      select: { id: true },
    })
    if (!exists) return code
  }
  throw new Error('Konnte keinen eindeutigen Zertifikatscode erzeugen')
}

/**
 * Wendet eine bezahlte Checkout-Session auf das Dossier an (idempotent).
 * Findet/erstellt das Zertifikat per E-Mail, fügt bezahlte Module hinzu (PENDING_DOCS),
 * verlängert die Gültigkeit und schickt einen Magic-Link zum Upload.
 */
export async function fulfillSicPaidCheckout(input: {
  stripeCheckoutSessionId: string
  stripePaymentIntentId?: string | null
}): Promise<FulfillResult> {
  const payment = await prisma.sicPayment.findUnique({
    where: { stripeCheckoutSessionId: input.stripeCheckoutSessionId },
  })
  if (!payment) return { ok: false, reason: 'PAYMENT_NOT_FOUND' }

  if (payment.status === 'PAID' && payment.certificateId) {
    const cert = await prisma.sicCertificate.findUnique({
      where: { id: payment.certificateId },
      select: { certificateCode: true },
    })
    return {
      ok: true,
      certificateId: payment.certificateId,
      certificateCode: cert?.certificateCode ?? '',
      email: payment.email,
      alreadyDone: true,
    }
  }

  const now = new Date()
  const email = payment.email
  const moduleKinds = (payment.moduleKinds as SicModuleKind[]) ?? []

  const existing = await prisma.sicCertificate.findUnique({ where: { email } })
  const code = existing ? existing.certificateCode : await ensureUniqueCode()
  const prefillName = splitHolderName(payment.holderName)

  const cert = await prisma.$transaction(async tx => {
    const c =
      existing ?
        await tx.sicCertificate.update({
          where: { id: existing.id },
          data: {
            status: 'ACTIVE',
            expiresAt: sicExtendedExpiresAt(existing.expiresAt, now),
            // Nur ergänzen, wenn noch kein Name gesetzt ist — vorhandene Angaben nie überschreiben.
            ...(prefillName && !existing.holderFirstName && !existing.holderLastName ?
              { holderFirstName: prefillName.firstName, holderLastName: prefillName.lastName || null }
            : {}),
          },
        })
      : await tx.sicCertificate.create({
          data: {
            email,
            certificateCode: code,
            status: 'ACTIVE',
            issuedAt: now,
            expiresAt: sicValidityExpiresAt(now),
            ...(prefillName ?
              { holderFirstName: prefillName.firstName, holderLastName: prefillName.lastName || null }
            : {}),
          },
        })

    for (const kind of moduleKinds) {
      await tx.sicCertificateModule.upsert({
        where: { certificateId_moduleKind: { certificateId: c.id, moduleKind: kind } },
        create: { certificateId: c.id, moduleKind: kind, status: 'PENDING_DOCS', paidAt: now },
        update: {},
      })
    }

    await tx.sicPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: now,
        certificateId: c.id,
        stripePaymentIntentId: input.stripePaymentIntentId ?? payment.stripePaymentIntentId,
      },
    })

    return c
  })

  try {
    const { url } = await createSicMagicLink(email)
    await sendSicMagicLinkEmail(email, url)
  } catch (err) {
    console.error('[sic/fulfillment] magic link email failed', err)
  }

  return { ok: true, certificateId: cert.id, certificateCode: cert.certificateCode, email, alreadyDone: false }
}
