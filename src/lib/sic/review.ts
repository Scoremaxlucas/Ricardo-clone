import { prisma } from '@/lib/prisma'
import { joinHolderName } from '@/lib/sic/dossier'
import { recordSicEvent } from '@/lib/sic/events'
import type { SicFacts } from '@/lib/sic/facts'
import type { SicModuleId } from '@/lib/sic/modules'
import { sicExpiresAtAfterApproval, sicExpiryClockChanged } from '@/lib/sic/validity'
import type { SicModuleKind } from '@prisma/client'

export type ApproveResult = {
  certificateId: string
  certificateCode: string
  email: string
  holderName: string | null
  /** Erste Freigabe überhaupt — ab hier existiert ein abrufbares Zertifikat. */
  firstVerification: boolean
  verifiedCount: number
  expiresAt: Date
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
      certifiedAt: true,
      expiresAt: true,
    },
  })
  if (!cert) return null
  // Ein widerrufenes Zertifikat darf durch eine Freigabe nicht wieder aufleben.
  if (cert.status === 'REVOKED') return null

  const firstVerification = !cert.certifiedAt
  const nextExpiresAt = sicExpiresAtAfterApproval({
    moduleKind: opts.moduleKind,
    extractDate: opts.facts.extractDate,
    currentExpiresAt: cert.expiresAt,
    approvedAt: now,
  })
  const clockChanged = sicExpiryClockChanged(cert.expiresAt, nextExpiresAt)

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
        status: 'ACTIVE',
        expiresAt: nextExpiresAt,
        ...(firstVerification ? { certifiedAt: now } : {}),
        ...(clockChanged ?
          { expiryReminder14dSentAt: null, expiryReminder3dSentAt: null }
        : {}),
        updatedAt: now,
      },
    })

    const verifiedCount = await tx.sicCertificateModule.count({
      where: { certificateId: opts.certificateId, status: 'VERIFIED' },
    })

    return { verifiedCount }
  })

  if (!result) return null

  await recordSicEvent({
    kind: 'MODULE_VERIFIED',
    certificateId: cert.id,
    email: cert.email,
    moduleKind: opts.moduleKind as SicModuleKind,
    meta: { firstVerification, verifiedCount: result.verifiedCount },
  })

  const holderName = joinHolderName(cert.holderFirstName, cert.holderLastName)

  return {
    certificateId: cert.id,
    certificateCode: cert.certificateCode,
    email: cert.email,
    holderName,
    firstVerification,
    verifiedCount: result.verifiedCount,
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
    select: { id: true, email: true },
  })
  if (!cert) return null

  const updated = await prisma.sicCertificateModule.updateMany({
    where: { certificateId: opts.certificateId, moduleKind: opts.moduleKind as SicModuleKind },
    data: {
      status: 'REJECTED',
      reviewedAt: now,
      reviewedByUserId: opts.reviewerId,
      reviewNote: opts.note,
    },
  })
  if (updated.count === 0) return null

  await prisma.sicCertificate.update({
    where: { id: opts.certificateId },
    data: { updatedAt: now },
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
