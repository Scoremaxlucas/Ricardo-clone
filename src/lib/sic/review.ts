import { prisma } from '@/lib/prisma'
import { joinHouseholdHolderName } from '@/lib/sic/dossier'
import { isSicCouple } from '@/lib/sic/household'
import { recordSicEvent } from '@/lib/sic/events'
import { readSicFacts, sicIdValidUntil, type SicFacts } from '@/lib/sic/facts'
import type { SicModuleId } from '@/lib/sic/modules'
import { sicExpiresAtAfterApproval, sicExpiryClockChanged, sicSwissIsoDay } from '@/lib/sic/validity'
import { Prisma, type SicModuleKind } from '@prisma/client'

export type ApproveResult = {
  certificateId: string
  certificateCode: string
  email: string
  holderName: string | null
  /** Erste Freigabe überhaupt — ab hier existiert ein abrufbares Dokument. */
  firstVerification: boolean
  verifiedCount: number
  verifiedModuleIds: SicModuleId[]
  expiresAt: Date | null
}

/**
 * Gibt ein Modul frei und schreibt die geprüften Werte.
 *
 * Die Gültigkeit hängt am Betreibungsauszug (Auszugsdatum + drei Monate).
 * Andere Angaben ändern «Gültig bis» nicht. Das Ausstellungsdatum auf dem
 * Dokument bleibt der Tag der ersten Freigabe, nicht der Kauftag.
 */
export async function approveSicModule(opts: {
  certificateId: string
  moduleKind: SicModuleId
  facts: SicFacts
  reviewerId: string
  now?: Date
}): Promise<ApproveResult | null> {
  const now = opts.now ?? new Date()

  const cert = await prisma.sicCertificate.findUnique({
    where: { id: opts.certificateId },
    select: {
      id: true,
      email: true,
      certificateCode: true,
      status: true,
      holderFirstName: true,
      holderLastName: true,
      holder2FirstName: true,
      holder2LastName: true,
      householdKind: true,
      certifiedAt: true,
      expiresAt: true,
    },
  })
  if (!cert) return null
  // Ein widerrufenes Zertifikat darf durch eine Freigabe nicht wieder aufleben.
  if (cert.status === 'REVOKED') return null

  // Laufende Mietverhältnisse gelten «Stand Referenz» — ohne Datum auf dem Formular der Tag der Freigabe.
  const facts: SicFacts =
    opts.moduleKind === 'ZUVERLAESSIGKEIT' && !opts.facts.tenancyTo && !opts.facts.referenceDate ?
      { ...opts.facts, referenceDate: sicSwissIsoDay(now) }
    : opts.facts

  // Das Zertifikat gilt nicht länger als der geprüfte Ausweis. Wird ein neuer Ausweis
  // freigegeben, rechnet die Frist wieder ab dem geprüften Auszug statt ab der gekürzten.
  // Der Ausweis zählt auch, solange ein neuer eingereicht ist: die mitgetragenen Werte
  // stehen weiter auf dem Dokument, also gilt auch ihre Kappung.
  const stored = await prisma.sicCertificateModule.findMany({
    where: { certificateId: opts.certificateId, moduleKind: { in: ['AUFENTHALT', 'BONITAET'] } },
    select: { moduleKind: true, status: true, verifiedFacts: true },
  })
  const storedFacts = (kind: 'AUFENTHALT' | 'BONITAET') => {
    const row = stored.find(m => m.moduleKind === kind)
    if (!row || (kind === 'BONITAET' && row.status !== 'VERIFIED')) return null
    return readSicFacts(kind, row.verifiedFacts)
  }
  const idFacts = opts.moduleKind === 'AUFENTHALT' ? facts : storedFacts('AUFENTHALT')
  const extractFacts = opts.moduleKind === 'BONITAET' ? facts : storedFacts('BONITAET')

  const firstVerification = !cert.certifiedAt
  // Schon ausgestellt, aber ohne Frist (Verlängerung nach Ablauf, Auszug abgelehnt):
  // gültig wird es erst wieder mit einem geprüften Betreibungsauszug, nicht mit einer
  // anderen Angabe. Die vorläufige Frist gilt nur bis zur allerersten Freigabe.
  const awaitingExtract = !firstVerification && !cert.expiresAt && opts.moduleKind !== 'BONITAET'
  const nextExpiresAt: Date | null =
    awaitingExtract ? null : (
      sicExpiresAtAfterApproval({
        moduleKind: extractFacts?.extractDate ? 'BONITAET' : opts.moduleKind,
        extractDate: extractFacts?.extractDate,
        extractDate2: extractFacts?.extractDate2,
        currentExpiresAt: cert.expiresAt,
        approvedAt: now,
        idValidUntil: sicIdValidUntil(idFacts),
      })
    )
  const clockChanged = !!nextExpiresAt && sicExpiryClockChanged(cert.expiresAt, nextExpiresAt)

  const result = await prisma.$transaction(async tx => {
    const updated = await tx.sicCertificateModule.updateMany({
      where: { certificateId: opts.certificateId, moduleKind: opts.moduleKind as SicModuleKind },
      data: {
        status: 'VERIFIED',
        verifiedFacts: facts,
        reviewedAt: now,
        reviewedByUserId: opts.reviewerId,
        reviewNote: null,
      },
    })
    if (updated.count === 0) return null

    await tx.sicCertificate.update({
      where: { id: opts.certificateId },
      data: {
        // Eine Freigabe belebt kein abgelaufenes Zertifikat mit alter Frist wieder.
        status: !nextExpiresAt || nextExpiresAt.getTime() > now.getTime() ? 'ACTIVE' : 'EXPIRED',
        expiresAt: nextExpiresAt,
        ...(firstVerification ? { certifiedAt: now } : {}),
        ...(clockChanged ?
          { expiryReminder14dSentAt: null, expiryReminder3dSentAt: null }
        : {}),
        updatedAt: now,
      },
    })

    // Neuer Auszug geprüft = neue Frist. Werte, die aus der Zeit vor einer frühzeitigen
    // Verlängerung mitgetragen wurden, gelten ab hier nicht mehr.
    // Der Ausweis ist davon ausgenommen: seine Werte trägt ein noch gültiger alter Ausweis.
    if (opts.moduleKind === 'BONITAET') {
      await tx.sicCertificateModule.updateMany({
        where: {
          certificateId: opts.certificateId,
          moduleKind: { not: 'AUFENTHALT' },
          status: { in: ['PENDING_DOCS', 'IN_REVIEW', 'REJECTED'] },
          NOT: { verifiedFacts: { equals: Prisma.DbNull } },
        },
        data: { verifiedFacts: Prisma.DbNull },
      })
    }

    const verified = await tx.sicCertificateModule.findMany({
      where: { certificateId: opts.certificateId, status: 'VERIFIED' },
      select: { moduleKind: true },
    })

    return {
      verifiedCount: verified.length,
      verifiedModuleIds: verified.map(m => m.moduleKind as SicModuleId),
    }
  })

  if (!result) return null

  await recordSicEvent({
    kind: 'MODULE_VERIFIED',
    certificateId: cert.id,
    email: cert.email,
    moduleKind: opts.moduleKind as SicModuleKind,
    meta: { firstVerification, verifiedCount: result.verifiedCount },
  })

  const holderName = joinHouseholdHolderName({
    firstName: cert.holderFirstName,
    lastName: cert.holderLastName,
    firstName2: cert.holder2FirstName,
    lastName2: cert.holder2LastName,
    couple: isSicCouple(cert.householdKind),
  })

  return {
    certificateId: cert.id,
    certificateCode: cert.certificateCode,
    email: cert.email,
    holderName,
    firstVerification,
    verifiedCount: result.verifiedCount,
    verifiedModuleIds: result.verifiedModuleIds,
    expiresAt: nextExpiresAt,
  }
}

export async function rejectSicModule(opts: {
  certificateId: string
  moduleKind: SicModuleId
  note: string
  reviewerId: string
  now?: Date
}): Promise<{ email: string } | null> {
  const now = opts.now ?? new Date()
  const cert = await prisma.sicCertificate.findUnique({
    where: { id: opts.certificateId },
    select: { id: true, email: true, status: true },
  })
  if (!cert) return null
  // Widerrufen ist endgültig — keine Aufforderung zum Nachreichen mehr.
  if (cert.status === 'REVOKED') return null

  const wasVerified =
    (await prisma.sicCertificateModule.count({
      where: { certificateId: opts.certificateId, moduleKind: opts.moduleKind as SicModuleKind, status: 'VERIFIED' },
    })) > 0

  // Ausnahme Ausweis: wird der *neue* Ausweis abgelehnt, bleibt der alte, noch gültige stehen —
  // ein unleserlicher Scan widerlegt ihn nicht. Abgelaufene Werte blendet sicPresentedModules aus.
  const keepOldId = opts.moduleKind === 'AUFENTHALT' && !wasVerified
  const updated = await prisma.sicCertificateModule.updateMany({
    where: { certificateId: opts.certificateId, moduleKind: opts.moduleKind as SicModuleKind },
    data: {
      status: 'REJECTED',
      // Eine abgelehnte Angabe darf keine früher freigegebenen Werte mehr tragen — auch keine
      // aus einer frühzeitigen Verlängerung mitgetragenen: der neue Nachweis kann sie widerlegen.
      ...(keepOldId ? {} : { verifiedFacts: Prisma.DbNull }),
      reviewedAt: now,
      reviewedByUserId: opts.reviewerId,
      reviewNote: opts.note,
    },
  })
  if (updated.count === 0) return null

  // Wird der Betreibungsauszug nach einer Freigabe abgelehnt, fällt die daraus abgeleitete Gültigkeit weg.
  const dropExpiry = wasVerified && opts.moduleKind === 'BONITAET'
  await prisma.sicCertificate.update({
    where: { id: opts.certificateId },
    data: {
      updatedAt: now,
      ...(dropExpiry ? { expiresAt: null, expiryReminder14dSentAt: null, expiryReminder3dSentAt: null } : {}),
    },
  })

  await recordSicEvent({
    kind: 'MODULE_REJECTED',
    certificateId: cert.id,
    email: cert.email,
    moduleKind: opts.moduleKind as SicModuleKind,
  })

  return { email: cert.email }
}

export { SIC_REJECTION_REASONS } from '@/lib/sic/rejection-reasons'
