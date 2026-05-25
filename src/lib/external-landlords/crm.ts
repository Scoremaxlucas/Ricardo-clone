import { prisma } from '@/lib/prisma'
import {
  decryptLandlordContactFromStorage,
  encryptLandlordContactForStorage,
} from '@/lib/rental/pdf-crypto'
import {
  extractBestEmailFromPlaintext,
  normalizeAndValidateLandlordNotifyEmail,
} from '@/lib/rental/resolve-landlord-notify-email'
import type {
  ExternalLandlordContactKind,
  ExternalLandlordEvidenceSource,
  ExternalLandlordKind,
} from '@prisma/client'

type ExternalLandlordDb = Pick<
  typeof prisma,
  'externalLandlord' | 'externalLandlordContact' | 'externalLandlordPermission' | 'rentalListing'
>

type ParsedLandlordIdentity = {
  displayName: string | null
  normalizedEmail: string | null
  normalizedPhone: string | null
  note: string | null
}

export type ParsedLandlordContactPlain = {
  name: string | null
  contact: string | null
  note: string | null
}

export function decryptExternalLandlordContactValue(valueEncrypted: string): string | null {
  return decryptLandlordContactFromStorage(valueEncrypted)
}

export function normalizeExternalLandlordEmail(raw: string | null | undefined): string | null {
  return normalizeAndValidateLandlordNotifyEmail(raw ?? null)
}

export function normalizeExternalLandlordPhone(raw: string | null | undefined): string | null {
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  if (!trimmed) return null
  let digits = trimmed.replace(/[^\d+]/g, '')
  if (!digits) return null
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`
  if (digits.startsWith('+')) {
    const onlyDigits = digits.slice(1).replace(/\D/g, '')
    return onlyDigits.length >= 8 ? `+${onlyDigits}` : null
  }
  const onlyDigits = digits.replace(/\D/g, '')
  if (onlyDigits.startsWith('41') && onlyDigits.length >= 9) return `+${onlyDigits}`
  if (onlyDigits.startsWith('0') && onlyDigits.length >= 9) return `+41${onlyDigits.slice(1)}`
  return onlyDigits.length >= 8 ? `+${onlyDigits}` : null
}

export function externalLandlordDisplayName(
  displayName: string | null | undefined,
  normalizedEmail: string | null | undefined,
  normalizedPhone: string | null | undefined
): string {
  const d = displayName?.trim()
  if (d) return d
  if (normalizedEmail) return normalizedEmail
  if (normalizedPhone) return normalizedPhone
  return 'Unbekannter Vermieter'
}

export function parseStoredLandlordContact(stored: string | null | undefined): ParsedLandlordContactPlain {
  return parseLandlordContactPlain(decryptLandlordContactFromStorage(stored ?? null))
}

export function parseLandlordContactPlain(text: string | null | undefined): ParsedLandlordContactPlain {
  if (!text) {
    return { name: null, contact: null, note: null }
  }
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)

  let name: string | null = null
  let contact: string | null = null
  const noteParts: string[] = []

  for (const line of lines) {
    const nameMatch = /^(name|ansprechpartner|vermieter)\s*:\s*(.+)$/i.exec(line)
    if (nameMatch?.[2]) {
      if (!name) name = cleanString(nameMatch[2])
      continue
    }

    const contactMatch = /^(kontakt(?:\s*\(.+\))?)\s*:\s*(.+)$/i.exec(line)
    if (contactMatch?.[2]) {
      if (!contact) contact = cleanString(contactMatch[2])
      continue
    }

    const noteMatch = /^(notiz|note)\s*:\s*(.+)$/i.exec(line)
    if (noteMatch?.[2]) {
      noteParts.push(noteMatch[2].trim())
      continue
    }
  }

  return {
    name,
    contact,
    note: noteParts.length ? noteParts.join('\n') : null,
  }
}

function parseLandlordIdentity(input: {
  landlordNotifyEmail?: string | null
  landlordContactStored?: string | null
  landlordContactPlain?: string | null
  fallbackDisplayName?: string | null
}): ParsedLandlordIdentity {
  const plain =
    typeof input.landlordContactPlain === 'string' && input.landlordContactPlain.trim() ?
      input.landlordContactPlain.trim()
    : decryptLandlordContactFromStorage(input.landlordContactStored ?? null)

  const normalizedEmail =
    normalizeExternalLandlordEmail(input.landlordNotifyEmail) || (plain ? extractBestEmailFromPlaintext(plain) : null)

  const normalizedPhone = plain ? extractPhoneFromText(plain) : null
  const displayName = parseNameFromText(plain) || cleanString(input.fallbackDisplayName)
  const note = parseNoteFromText(plain)

  return {
    displayName,
    normalizedEmail,
    normalizedPhone,
    note,
  }
}

function parseNameFromText(text: string | null | undefined): string | null {
  return parseLandlordContactPlain(text).name
}

function parseNoteFromText(text: string | null | undefined): string | null {
  return parseLandlordContactPlain(text).note
}

function extractPhoneFromText(text: string): string | null {
  const matches = text.match(/(?:\+?\d[\d\s()./-]{6,}\d)/g) ?? []
  for (const match of matches) {
    const normalized = normalizeExternalLandlordPhone(match)
    if (normalized) return normalized
  }
  return null
}

function cleanString(value: string | null | undefined): string | null {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed ? trimmed : null
}

function evidenceSourceFromBasis(
  ingestPermissionBasis: string | null | undefined
): ExternalLandlordEvidenceSource | null {
  switch (ingestPermissionBasis) {
    case 'landlord_consent':
      return 'manual'
    case 'landlord_direct':
      return 'form'
    default:
      return null
  }
}

function permissionSummaryFromBasis(ingestPermissionBasis: string | null | undefined): string | null {
  switch (ingestPermissionBasis) {
    case 'landlord_consent':
      return 'Erlaubnis des Vermieters zur Veröffentlichung auf Helvenda wurde im Admin-Ingest bestätigt.'
    case 'landlord_direct':
      return 'Daten wurden direkt vom Vermieter für die Veröffentlichung auf Helvenda übermittelt.'
    default:
      return null
  }
}

async function findMatchingExternalLandlord(
  db: ExternalLandlordDb,
  identity: ParsedLandlordIdentity
): Promise<{ id: string } | null> {
  const or: Array<Record<string, unknown>> = []
  if (identity.normalizedEmail) {
    or.push(
      { normalizedPrimaryEmail: identity.normalizedEmail },
      { contacts: { some: { normalizedValue: identity.normalizedEmail } } }
    )
  }
  if (identity.normalizedPhone) {
    or.push(
      { normalizedPrimaryPhone: identity.normalizedPhone },
      { contacts: { some: { normalizedValue: identity.normalizedPhone } } }
    )
  }
  if (!or.length) return null
  return db.externalLandlord.findFirst({
    where: { OR: or },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })
}

async function ensureContact(args: {
  db: ExternalLandlordDb
  externalLandlordId: string
  kind: ExternalLandlordContactKind
  value: string
  normalizedValue: string | null
  label?: string | null
  isPrimary?: boolean
  note?: string | null
}) {
  const { db, externalLandlordId, kind, value, normalizedValue } = args
  const existing =
    normalizedValue ?
      await db.externalLandlordContact.findFirst({
        where: {
          externalLandlordId,
          kind,
          normalizedValue,
        },
        select: { id: true, isPrimary: true },
      })
    : null

  if (existing) {
    if (args.isPrimary && !existing.isPrimary) {
      await db.externalLandlordContact.update({
        where: { id: existing.id },
        data: { isPrimary: true },
      })
    }
    return existing.id
  }

  const created = await db.externalLandlordContact.create({
    data: {
      externalLandlordId,
      kind,
      label: cleanString(args.label),
      valueEncrypted: encryptLandlordContactForStorage(value)!,
      normalizedValue,
      isPrimary: Boolean(args.isPrimary),
      note: cleanString(args.note),
    },
    select: { id: true },
  })
  return created.id
}

export async function ensureExternalLandlordForListingInput(args: {
  db: ExternalLandlordDb
  rentalListingId: string
  existingExternalLandlordId?: string | null
  landlordNotifyEmail?: string | null
  landlordContactStored?: string | null
  landlordContactPlain?: string | null
  ingestPermissionBasis?: string | null
  fallbackDisplayName?: string | null
  preferredKind?: ExternalLandlordKind
}) {
  const identity = parseLandlordIdentity({
    landlordNotifyEmail: args.landlordNotifyEmail,
    landlordContactStored: args.landlordContactStored,
    landlordContactPlain: args.landlordContactPlain,
    fallbackDisplayName: args.fallbackDisplayName,
  })

  let externalLandlordId = args.existingExternalLandlordId ?? null
  if (!externalLandlordId) {
    const match = await findMatchingExternalLandlord(args.db, identity)
    externalLandlordId = match?.id ?? null
  }

  if (!externalLandlordId) {
    const created = await args.db.externalLandlord.create({
      data: {
        displayName: externalLandlordDisplayName(
          identity.displayName,
          identity.normalizedEmail,
          identity.normalizedPhone
        ),
        kind: args.preferredKind ?? 'unknown',
        normalizedPrimaryEmail: identity.normalizedEmail,
        normalizedPrimaryPhone: identity.normalizedPhone,
        internalNotes: identity.note,
      },
      select: { id: true },
    })
    externalLandlordId = created.id
  } else {
    const landlord = await args.db.externalLandlord.findUnique({
      where: { id: externalLandlordId },
      select: {
        displayName: true,
        normalizedPrimaryEmail: true,
        normalizedPrimaryPhone: true,
        internalNotes: true,
      },
    })
    if (landlord) {
      await args.db.externalLandlord.update({
        where: { id: externalLandlordId },
        data: {
          displayName:
            landlord.displayName?.trim() || !identity.displayName ?
              undefined
            : identity.displayName,
          normalizedPrimaryEmail: landlord.normalizedPrimaryEmail || identity.normalizedEmail || undefined,
          normalizedPrimaryPhone: landlord.normalizedPrimaryPhone || identity.normalizedPhone || undefined,
          internalNotes: landlord.internalNotes?.trim() || !identity.note ? undefined : identity.note,
        },
      })
    }
  }

  if (identity.normalizedEmail) {
    await ensureContact({
      db: args.db,
      externalLandlordId,
      kind: 'email',
      value: identity.normalizedEmail,
      normalizedValue: identity.normalizedEmail,
      label: 'Lead / Kontakt',
      isPrimary: true,
    })
  }

  if (identity.normalizedPhone) {
    await ensureContact({
      db: args.db,
      externalLandlordId,
      kind: 'phone',
      value: identity.normalizedPhone,
      normalizedValue: identity.normalizedPhone,
      label: 'Telefon',
      isPrimary: true,
    })
  }

  const permissionSummary = permissionSummaryFromBasis(args.ingestPermissionBasis)
  const permissionSource = evidenceSourceFromBasis(args.ingestPermissionBasis)
  if (permissionSummary && permissionSource) {
    const existingPermission = await args.db.externalLandlordPermission.findFirst({
      where: {
        externalLandlordId,
        rentalListingId: args.rentalListingId,
        kind: 'listing_publication',
      },
      select: { id: true },
    })
    if (!existingPermission) {
      await args.db.externalLandlordPermission.create({
        data: {
          externalLandlordId,
          rentalListingId: args.rentalListingId,
          kind: 'listing_publication',
          source: permissionSource,
          summary: permissionSummary,
        },
      })
    }
  }

  const listingRow = await args.db.rentalListing.findUnique({
    where: { id: args.rentalListingId },
    select: { externalLandlordId: true },
  })
  if (listingRow?.externalLandlordId !== externalLandlordId) {
    await args.db.rentalListing.update({
      where: { id: args.rentalListingId },
      data: { externalLandlordId },
    })
  }

  return externalLandlordId
}
