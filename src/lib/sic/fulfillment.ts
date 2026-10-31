import { prisma } from '@/lib/prisma'
import { deleteSicBlob } from '@/lib/sic/blob-delete'
import { allocateUniqueSicCertificateCode } from '@/lib/sic/codes'
import { sendSicMagicLinkEmail, sendSicPaymentReceiptEmail, sendSicRefundEmail } from '@/lib/sic/email'
import { recordSicEvent } from '@/lib/sic/events'
import { sicLog } from '@/lib/sic/log'
import { createSicMagicLink } from '@/lib/sic/magic-link'
import { loadSicRenewalPending, modulesResetByRenewal, sicRenewalCarriesFacts } from '@/lib/sic/renewal'
import { refundSicPayment } from '@/lib/sic/payment-refund'
import { sicRevokedCanStartOver } from '@/lib/sic/revoke'
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

/**
 * Verlängerung innerhalb einer bestehenden Prisma-Transaction anwenden. Alternde
 * Angaben werden auf «Unterlagen fehlen» zurückgesetzt und ihre Dokumente aus
 * der DB entfernt. Die zugehörigen Blob-URLs werden zurückgegeben, damit die
 * Vercel-Blob-Löschung erst NACH dem Commit passiert (Netzwerk-Nebeneffekt,
 * darf keine Transaction offenhalten).
 *
 * So bleibt Zahlung + Verlängerungs-Reset atomar: entweder beides oder keines.
 * Vorher wurde die Verlängerung nach der Payment-Transaction ausgeführt — ein
 * Absturz dazwischen hätte den Kunden bezahlen lassen ohne Modul-Reset.
 */
async function applyRenewalInTx(
  tx: Prisma.TransactionClient,
  certificateId: string,
  now: Date
): Promise<{ resetModules: SicModuleId[]; staleBlobUrls: string[] }> {
  const cert = await tx.sicCertificate.findUniqueOrThrow({
    where: { id: certificateId },
    select: { status: true, expiresAt: true },
  })
  // Frühzeitig verlängert: das laufende Zertifikat bleibt, wie es ist, bis der neue
  // Auszug geprüft ist. Abgelaufen: die alte Frist ist gegenstandslos, die neue
  // beginnt erst mit der Freigabe des neuen Auszugs.
  const stillValid = cert.status === 'ACTIVE' && !!cert.expiresAt && cert.expiresAt.getTime() > now.getTime()

  const modules = await tx.sicCertificateModule.findMany({
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
  const certificateUpdate: Prisma.SicCertificateUpdateInput =
    stillValid ?
      { status: 'ACTIVE', docsPurgeWarningSentAt: null }
    : {
        status: 'ACTIVE',
        expiresAt: null,
        expiryReminder14dSentAt: null,
        expiryReminder3dSentAt: null,
        docsPurgeWarningSentAt: null,
      }
  if (toReset.length === 0) {
    await tx.sicCertificate.update({ where: { id: certificateId }, data: certificateUpdate })
    return { resetModules: [], staleBlobUrls: [] }
  }

  const staleDocs = await tx.sicDocument.findMany({
    where: { certificateId, moduleKind: { in: toReset as SicModuleKind[] } },
    select: { id: true, blobUrl: true },
  })

  const resetData = {
    status: 'PENDING_DOCS' as const,
    reviewedAt: null,
    reviewedByUserId: null,
    reviewNote: null,
    uploadReminderSentAt: null,
  }
  // Solange das Zertifikat gilt, bleiben die geprüften Werte stehen (PDF, Prüfseite),
  // bis der neue Nachweis freigegeben ist. Ein abgelaufener Ausweis gehört nicht dazu.
  const carry = stillValid ? toReset.filter(sicRenewalCarriesFacts) : []
  const clear = toReset.filter(id => !carry.includes(id))
  if (carry.length > 0) {
    await tx.sicCertificateModule.updateMany({
      where: { certificateId, moduleKind: { in: carry as SicModuleKind[] } },
      data: resetData,
    })
  }
  if (clear.length > 0) {
    await tx.sicCertificateModule.updateMany({
      where: { certificateId, moduleKind: { in: clear as SicModuleKind[] } },
      data: { ...resetData, verifiedFacts: Prisma.DbNull },
    })
  }
  if (staleDocs.length > 0) {
    await tx.sicDocument.deleteMany({ where: { id: { in: staleDocs.map(d => d.id) } } })
  }
  await tx.sicCertificate.update({ where: { id: certificateId }, data: certificateUpdate })

  return { resetModules: toReset, staleBlobUrls: staleDocs.map(d => d.blobUrl) }
}

/**
 * Nach dem Commit die (nicht mehr referenzierten) Blobs entfernen.
 * Best-effort: ein Blob-Fehler kippt keinen bereits fixierten DB-Zustand mehr.
 */
async function deleteStaleBlobs(blobUrls: string[]): Promise<void> {
  if (blobUrls.length === 0) return
  await Promise.all(blobUrls.map(u => deleteSicBlob(u)))
}

/**
 * Magic-Link nach erfolgreicher Zahlung zustellen — mit kurzem Retry, weil
 * transiente Mail-Fehler (Provider-Timeout, TLS-Blip) sonst ein bezahltes,
 * aber unerreichbares Zertifikat hinterlassen würden.
 *
 * Kunde hat trotzdem immer noch die Rettung: auf /sic/zertifikat kann er sich
 * per Magic-Link jederzeit einen neuen Zugangslink zusenden lassen.
 */
async function sendPostCheckoutMagicLinkWithRetry(email: string): Promise<void> {
  const delays = [500, 2000]
  let lastErr: unknown
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      const { url } = await createSicMagicLink(email)
      await sendSicMagicLinkEmail(email, url, 'checkout')
      if (attempt > 0) {
        sicLog('sic.fulfillment.magic_link_recovered', { attempt })
      }
      return
    } catch (err) {
      lastErr = err
      if (attempt < delays.length) {
        await new Promise(r => setTimeout(r, delays[attempt]))
      }
    }
  }
  console.error('[sic/fulfillment] magic link email failed after retries', lastErr)
  sicLog('sic.fulfillment.magic_link_failed_after_retries', {
    reason: lastErr instanceof Error ? lastErr.message : 'unknown',
  })
}

/**
 * Wendet eine bezahlte Checkout-Session auf das Dossier an (idempotent).
 * Findet/erstellt das Zertifikat per E-Mail, fügt bezahlte Module hinzu (PENDING_DOCS)
 * bzw. wendet eine Verlängerung an und schickt einen Magic-Link zum Upload.
 *
 * Die Gültigkeit wird hier **nicht** gesetzt: sie beginnt mit der ersten
 * Freigabe und richtet sich nach dem Betreibungsauszug, sobald der geprüft ist.
 */
/** Wird geworfen, wenn ein paralleler Worker die Zahlung innerhalb der Transaction bereits auf PAID gesetzt hat. */
class SicPaymentAlreadyClaimedError extends Error {
  constructor() {
    super('SIC payment already claimed by a concurrent fulfillment')
  }
}

const SIC_FULFILL_MAX_ATTEMPTS = 3

export async function fulfillSicPaidCheckout(
  input: {
    stripeCheckoutSessionId: string
    stripePaymentIntentId?: string | null
  },
  attempt = 1
): Promise<FulfillResult> {
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
  const existing = await prisma.sicCertificate.findUnique({
    where: { email },
    include: { modules: { select: { moduleKind: true } } },
  })
  // Neu anlegen nach Widerruf: nur nach voller Erstattung (keine PAID-Zahlung mehr).
  // Ein Widerruf wegen Missbrauchs lässt sich mit einer alten, offenen Zahlung nicht umgehen.
  const revoked = existing?.status === 'REVOKED'
  const startOver =
    !!existing && revoked && payment.includeBaseFee && !isRenewal && (await sicRevokedCanStartOver(existing.id))
  const alreadyOwned = new Set(startOver ? [] : (existing?.modules ?? []).map(m => m.moduleKind))
  const newKinds = moduleKinds.filter(k => !alreadyOwned.has(k))

  // Doppelzahlung: nichts Neues zu erfüllen → volle Erstattung (nur REFUNDED, wenn sie klappt).
  // Bei einer Verlängerung heisst das: eine frühere ist bezahlt und noch nicht abgeschlossen.
  // Auf ein widerrufenes Zertifikat (ohne Neuanfang) wird nichts gebucht — auch keine Verlängerung.
  const duplicate =
    !!existing &&
    ((revoked && !startOver) ||
      (isRenewal ?
        await loadSicRenewalPending(prisma, existing.id, { excludePaymentId: payment.id })
      : newKinds.length === 0))
  if (existing && duplicate) {
    // Zuerst beanspruchen: ein paralleler Lauf (Webhook + Bestätigungsseite) sieht dann
    // PAID und erstattet nicht ein zweites Mal oder überschreibt REFUNDED.
    const claimed = await prisma.sicPayment.updateMany({
      where: { id: payment.id, status: { in: ['PENDING', 'CANCELLED'] } },
      data: { status: 'PAID', paidAt: now, certificateId: existing.id, stripePaymentIntentId: pi },
    })
    if (claimed.count === 0) {
      if (attempt >= SIC_FULFILL_MAX_ATTEMPTS) return { ok: false, reason: 'PAYMENT_CLAIMED_ELSEWHERE' }
      return fulfillSicPaidCheckout(input, attempt + 1)
    }
    const refunded = await refundSicPayment(
      { ...payment, stripePaymentIntentId: pi ?? null },
      { idempotencyKey: `sic-duplicate-refund:${payment.id}` }
    )
    if (refunded) {
      await prisma.sicPayment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED' },
      })
      sicLog('sic.fulfillment.duplicate_refunded', {
        paymentId: payment.id,
        certificateId: existing.id,
      })
      await sendSicRefundEmail({ email, amountChf: Number(payment.amountChf) }).catch(err =>
        console.error('[sic/fulfillment] duplicate refund email', err)
      )
      return {
        ok: true,
        certificateId: existing.id,
        certificateCode: existing.certificateCode,
        email,
        alreadyDone: true,
        refundedDuplicate: true,
      }
    }
    // Refund fehlgeschlagen: bleibt PAID (oben beansprucht) ohne zweite Module; Ops sieht Log
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

  const code = existing && !startOver ? existing.certificateCode : await ensureUniqueCode()
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
  const isFirstCertificate = !existing || startOver

  let cert
  let startOverBlobUrls: string[] = []
  let renewalResult: { resetModules: SicModuleId[]; staleBlobUrls: string[] } = {
    resetModules: [],
    staleBlobUrls: [],
  }
  try {
    const txResult = await prisma.$transaction(async tx => {
      // Zuerst die Zahlung beanspruchen: nur PENDING/CANCELLED → PAID. Ein zweiter Worker wartet auf
      // die Zeilensperre, sieht danach PAID und bricht hier ab — so gibt es Zertifikat, Reset und
      // Magic-Link-Mail genau einmal, auch bei Verlängerung und Nachkauf ohne Unique-Constraint.
      const claimed = await tx.sicPayment.updateMany({
        where: { id: payment.id, status: { in: ['PENDING', 'CANCELLED'] } },
        data: { status: 'PAID', paidAt: now, stripePaymentIntentId: pi },
      })
      if (claimed.count === 0) throw new SicPaymentAlreadyClaimedError()

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
      if (startOver && existing) {
        const oldDocs = await tx.sicDocument.findMany({
          where: { certificateId: existing.id },
          select: { blobUrl: true },
        })
        startOverBlobUrls = oldDocs.map(d => d.blobUrl)
        await tx.sicDocument.deleteMany({ where: { certificateId: existing.id } })
        await tx.sicCertificateModule.deleteMany({ where: { certificateId: existing.id } })
        // Der alte Code zeigt auf der Prüfseite weiter «ersetzt», nie das neue Dossier.
        await tx.sicRetiredCertificateCode.create({
          data: { certificateId: existing.id, certificateCode: existing.certificateCode },
        })
        await tx.sicCertificate.update({
          where: { id: existing.id },
          data: {
            certificateCode: code,
            status: 'ACTIVE',
            issuedAt: now,
            certifiedAt: null,
            expiresAt: null,
            expiryReminder14dSentAt: null,
            expiryReminder3dSentAt: null,
            docsPurgeWarningSentAt: null,
            ...(prefillName ?
              {
                holderFirstName: null,
                holderLastName: null,
                holder2FirstName: null,
                holder2LastName: null,
                householdKind: 'SINGLE',
              }
            : {}),
          },
        })
      }
      const c =
        startOver && existing ?
          await tx.sicCertificate.update({ where: { id: existing.id }, data: nameData })
        : existing ?
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

      // Verlängerung im gleichen Transaction-Kontext: entweder wird die Zahlung
      // UND der Modul-Reset atomar committed, oder gar nichts.
      let renewal: { resetModules: SicModuleId[]; staleBlobUrls: string[] } = {
        resetModules: [],
        staleBlobUrls: [],
      }
      if (isRenewal) {
        renewal = await applyRenewalInTx(tx, c.id, now)
      }

      await tx.sicPayment.update({
        where: { id: payment.id },
        data: { certificateId: c.id },
      })

      return { cert: c, renewal }
    })
    cert = txResult.cert
    renewalResult = txResult.renewal
  } catch (err: unknown) {
    // Nur zwei Fälle werden wiederholt, beide mit begrenzter Tiefe:
    //  - ein paralleler Worker hat die Zahlung beansprucht → erneuter Aufruf liefert alreadyDone
    //  - Unique-Race beim Erstkauf (P2002 auf email) → mit bestehendem Zertifikat fortsetzen
    // Jeder andere Fehler (DB weg, Timeout) wird weitergereicht, statt endlos zu rekursieren.
    const uniqueRace = err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
    const claimedElsewhere = err instanceof SicPaymentAlreadyClaimedError
    if (!uniqueRace && !claimedElsewhere) throw err
    if (attempt >= SIC_FULFILL_MAX_ATTEMPTS) throw err
    if (uniqueRace) {
      const again = await prisma.sicCertificate.findUnique({
        where: { email },
        select: { id: true },
      })
      if (!again) throw err
    }
    return fulfillSicPaidCheckout(input, attempt + 1)
  }

  // NACH-Commit: Nebeneffekte, die nicht in die Transaction gehören.
  await deleteStaleBlobs([...renewalResult.staleBlobUrls, ...startOverBlobUrls])

  if (isRenewal) {
    await recordSicEvent({
      kind: 'RENEWAL_PURCHASED',
      certificateId: cert.id,
      email,
      meta: { resetModules: renewalResult.resetModules },
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

  if (Number(payment.amountChf) > 0) {
    await sendSicPaymentReceiptEmail({
      email,
      amountChf: Number(payment.amountChf),
      isRenewal,
      paidAt: now,
      paymentId: payment.id,
    }).catch(err => console.error('[sic/fulfillment] receipt email', err))
  }

  await sendPostCheckoutMagicLinkWithRetry(email)

  return { ok: true, certificateId: cert.id, certificateCode: cert.certificateCode, email, alreadyDone: false }
}
