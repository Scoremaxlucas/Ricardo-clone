import { prisma } from '@/lib/prisma'
import { joinHouseholdHolderName } from '@/lib/sic/dossier'
import { isSicCouple } from '@/lib/sic/household'
import { recordSicEvent } from '@/lib/sic/events'
import type { SicFacts } from '@/lib/sic/facts'
import type { SicModuleId } from '@/lib/sic/modules'
import { sicExpiresAtAfterApproval, sicExpiryClockChanged } from '@/lib/sic/validity'
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

  const firstVerification = !cert.certifiedAt
  // Schon ausgestellt, aber ohne Frist (Verlängerung nach Ablauf, Auszug abgelehnt):
  // gültig wird es erst wieder mit einem geprüften Betreibungsauszug, nicht mit einer
  // anderen Angabe. Die vorläufige Frist gilt nur bis zur allerersten Freigabe.
  const awaitingExtract = !firstVerification && !cert.expiresAt && opts.moduleKind !== 'BONITAET'
  const nextExpiresAt: Date | null =
    awaitingExtract ? null : (
      sicExpiresAtAfterApproval({
        moduleKind: opts.moduleKind,
        extractDate: opts.facts.extractDate,
        extractDate2: opts.facts.extractDate2,
        currentExpiresAt: cert.expiresAt,
        approvedAt: now,
      })
    )
  const clockChanged = !!nextExpiresAt && sicExpiryClockChanged(cert.expiresAt, nextExpiresAt)

  const result = await prisma.$transaction(async tx => {
    const updated = await tx.sicCertificateModule.updateMany({
      where: { certificateId: opts.certificateId, moduleKind: opts.moduleKind as SicModuleKind },
      data: {
        status: 'VERIFIED',
        verifiedFacts: opts.facts,
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
    if (opts.moduleKind === 'BONITAET') {
      await tx.sicCertificateModule.updateMany({
        where: {
          certificateId: opts.certificateId,
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

  const updated = await prisma.sicCertificateModule.updateMany({
    where: { certificateId: opts.certificateId, moduleKind: opts.moduleKind as SicModuleKind },
    data: {
      status: 'REJECTED',
      // Eine abgelehnte Angabe darf keine früher freigegebenen Werte mehr tragen — auch keine
      // aus einer frühzeitigen Verlängerung mitgetragenen: der neue Nachweis kann sie widerlegen.
      verifiedFacts: Prisma.DbNull,
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

/** Vorformulierte Ablehnungsgründe für die Prüfoberfläche. */
export const SIC_REJECTION_REASONS: readonly string[] = [
  'Der Auszug vom Betreibungsamt ist älter als drei Monate. Bitte einen aktuellen Auszug nachreichen.',
  'Das Dokument ist unvollständig — es fehlen Seiten oder Angaben.',
  'Das Dokument ist nicht lesbar. Bitte einen klaren Scan oder ein scharfes Foto hochladen.',
  'Auf dem Formular fehlt die Unterschrift.',
  'Der Name auf dem Nachweis stimmt nicht mit dem Namen auf dem Zertifikat überein.',
  'Der Inhalt des Nachweises erfüllt die Voraussetzungen für eine Freigabe nicht.',
] as const
