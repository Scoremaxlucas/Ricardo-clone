import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe-server'
import { allocateUniqueSicCertificateCode } from '@/lib/sic/codes'
import { sendSicMagicLinkEmail } from '@/lib/sic/email'
import { recordSicEvent } from '@/lib/sic/events'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { modulesResetByRenewal } from '@/lib/sic/renewal'
import { decodePaymentHolderName } from '@/lib/sic/dossier'
import type { SicModuleId } from '@/lib/sic/modules'
import { Prisma, type SicModuleKind } from '@prisma/client'

export type FulfillResult =
  | {
      ok: true
      certificateId: string
      certificateCode: string
      email: string
      alreadyDone: boolean
      refundedDuplicate?: boolean
    }
  | { ok: false; reason: string }

async function ensureUniqueCode(): Promise<string> {
  return allocateUniqueSicCertificateCode()
}

async function refundPaymentIntent(paymentIntentId: string | null | undefined): Promise<boolean> {
  if (!paymentIntentId) return false
  try {
    await stripe.refunds.create({ payment_intent: paymentIntentId })
    return true
  } catch (err) {
    console.error('[sic/fulfillment] refund failed', err)
    return false
  }
}

/**
 * Verlängerung anwenden: die alternden Angaben zurück auf «Unterlagen fehlen»,
 * ihre Nachweise löschen, damit die Prüfung nicht auf ein altes Dokument schaut.
 * Die dauerhaften Angaben bleiben verifiziert.
 */
async function applyRenewal(certificateId: string): Promise<SicModuleId[]> {
  const modules = await prisma.sicCertificateModule.findMany({
    where: { certificateId },
    select: { moduleKind: true, status: true, reviewedAt: true, verifiedFacts: true },
  })

  const toReset = modulesResetByRenewal(
    modules.map(m => ({
      moduleKind: m.moduleKind as SicModuleId,
      status: m.status,
      reviewedAt: m.reviewedAt,
      verifiedFacts: m.verifiedFacts,
    }))
  )
  if (toReset.length === 0) return []

  const staleDocs = await prisma.sicDocument.findMany({
    where: { certificateId, moduleKind: { in: toReset as SicModuleKind[] } },
    select: { id: true, blobUrl: true },
  })

  await prisma.$transaction(async tx => {
    await tx.sicCertificateModule.updateMany({
      where: { certificateId, moduleKind: { in: toReset as SicModuleKind[] } },
      data: {
        status: 'PENDING_DOCS',
        verifiedFacts: Prisma.DbNull,
        reviewedAt: null,
        reviewedByUserId: null,
        reviewNote: null,
        uploadReminderSentAt: null,
      },
    })
    if (staleDocs.length > 0) {
      await tx.sicDocument.deleteMany({ where: { id: { in: staleDocs.map(d => d.id) } } })
    }
    await tx.sicCertificate.update({
      where: { id: certificateId },
      data: { status: 'ACTIVE', docsPurgeWarningSentAt: null },
    })
  })

  if (staleDocs.length > 0) {
    try {
      const { del } = await import('@vercel/blob')
      await Promise.all(
        staleDocs.map(d => del(d.blobUrl).catch(() => undefined))
      )
    } catch {
      // Blobs evtl. schon weg — DB-Zustand ist bereits korrekt.
    }
  }

  return toReset
}

/**
 * Wendet eine bezahlte Checkout-Session auf das Dossier an (idempotent).
 * Findet/erstellt das Zertifikat per E-Mail, fügt bezahlte Module hinzu (PENDING_DOCS)
 * bzw. wendet eine Verlängerung an und schickt einen Magic-Link zum Upload.
 *
 * Die Gültigkeit wird hier **nicht** gesetzt: sie beginnt mit der ersten
 * Freigabe und richtet sich nach dem Betreibungsauszug, sobald der geprüft ist.
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

  if (payment.status === 'REFUNDED') {
    return { ok: false, reason: 'PAYMENT_REFUNDED' }
  }

  const now = new Date()
  const email = payment.email
  const isRenewal = payment.isRenewal
  const moduleKinds = (payment.moduleKinds as SicModuleKind[]) ?? []
  const pi = input.stripePaymentIntentId ?? payment.stripePaymentIntentId

  // Race: Zertifikat erneut laden — Module die schon existieren, nicht nochmals «verkaufen».
  let existing = await prisma.sicCertificate.findUnique({
    where: { email },
    include: { modules: { select: { moduleKind: true } } },
  })
  const alreadyOwned = new Set((existing?.modules ?? []).map(m => m.moduleKind))
  const newKinds = moduleKinds.filter(k => !alreadyOwned.has(k))

  // Doppelzahlung: nichts Neues zu erfüllen → Stripe full refund (nur REFUNDED wenn Refund OK)
  if (existing && newKinds.length === 0 && !isRenewal) {
    const refunded = await refundPaymentIntent(pi)
    if (refunded) {
      await prisma.sicPayment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          paidAt: now,
          certificateId: existing.id,
          stripePaymentIntentId: pi,
        },
      })
      sicLog('sic.fulfillment.duplicate_refunded', {
        paymentId: payment.id,
        certificateId: existing.id,
      })
      return {
        ok: true,
        certificateId: existing.id,
        certificateCode: existing.certificateCode,
        email,
        alreadyDone: true,
        refundedDuplicate: true,
      }
    }
    // Refund fehlgeschlagen: als PAID verknüpfen ohne zweite Module; Ops sieht Log
    await prisma.sicPayment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: now,
        certificateId: existing.id,
        stripePaymentIntentId: pi,
      },
    })
    sicLog('sic.fulfillment.refund_failed', {
      paymentId: payment.id,
      certificateId: existing.id,
      paymentIntentId: pi ?? null,
    })
    return {
      ok: true,
      certificateId: existing.id,
      certificateCode: existing.certificateCode,
      email,
      alreadyDone: true,
      refundedDuplicate: false,
    }
  }

  // Verlängerung ohne bestehendes Zertifikat ist gegenstandslos.
  if (isRenewal && !existing) {
    return { ok: false, reason: 'RENEWAL_WITHOUT_CERTIFICATE' }
  }

  const code = existing ? existing.certificateCode : await ensureUniqueCode()
  const decoded = decodePaymentHolderName(payment.holderName)
  const prefillName =
    decoded?.firstName && decoded.lastName ?
      {
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        firstName2: decoded.firstName2,
        lastName2: decoded.lastName2,
        couple: !!(decoded.firstName2 && decoded.lastName2),
      }
    : null
  const isFirstCertificate = !existing

  let cert
  try {
    cert = await prisma.$transaction(async tx => {
      const nameData =
        prefillName ?
          {
            holderFirstName: prefillName.firstName,
            holderLastName: prefillName.lastName,
            ...(prefillName.couple ?
              {
                holder2FirstName: prefillName.firstName2,
                holder2LastName: prefillName.lastName2,
                householdKind: 'COUPLE' as const,
              }
            : {}),
          }
        : {}
      const c =
        existing ?
          await tx.sicCertificate.update({
            where: { id: existing!.id },
            data: {
              ...(prefillName && !existing!.holderFirstName && !existing!.holderLastName ? nameData : {}),
            },
          })
        : await tx.sicCertificate.create({
            data: {
              email,
              certificateCode: code,
              status: 'ACTIVE',
              issuedAt: now,
              expiresAt: null,
              ...nameData,
            },
          })

      for (const kind of newKinds) {
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
          stripePaymentIntentId: pi,
        },
      })

      return c
    })
  } catch (err: unknown) {
    // Unique email race: zweiter paralleler Erstkauf — nachgeladen fortsetzen (max. 1 Retry-Semantik via PAID-Check oben)
    const again = await prisma.sicCertificate.findUnique({
      where: { email },
      include: { modules: { select: { moduleKind: true } } },
    })
    if (!again) throw err
    // Payment kann zwischenzeitlich von anderem Worker auf PAID gesetzt worden sein
    const refreshed = await prisma.sicPayment.findUnique({
      where: { id: payment.id },
    })
    if (refreshed?.status === 'PAID' || refreshed?.status === 'REFUNDED') {
      return fulfillSicPaidCheckout(input)
    }
    existing = again
    return fulfillSicPaidCheckout(input)
  }

  if (isRenewal) {
    const reset = await applyRenewal(cert.id)
    await recordSicEvent({
      kind: 'RENEWAL_PURCHASED',
      certificateId: cert.id,
      email,
      meta: { resetModules: reset },
    })
  }

  if (isFirstCertificate) {
    await recordSicEvent({
      kind: 'CERTIFICATE_CREATED',
      certificateId: cert.id,
      email,
      meta: { modules: newKinds },
    })
  }

  try {
    const { url } = await createSicMagicLink(email)
    await sendSicMagicLinkEmail(email, url, 'checkout')
  } catch (err) {
    console.error('[sic/fulfillment] magic link email failed', err)
  }

  return { ok: true, certificateId: cert.id, certificateCode: cert.certificateCode, email, alreadyDone: false }
}
