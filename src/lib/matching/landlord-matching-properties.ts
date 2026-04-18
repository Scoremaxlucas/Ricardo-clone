import type { MatchPropertyStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getLandlordAccountIdForUser } from './landlord-account'
import { parseLandlordRules } from './landlord-rules'

export type MatchingPropertyListRow = {
  id: string
  title: string
  city: string
  zip: string
  canton: string
  status: MatchPropertyStatus
  rentPerMonth: number
  rooms: string
  updatedAt: Date
  createdAt: Date
}

/** Snapshot für den Property-Wizard (nur String-Felder + erlaubte Status-Strings). */
export type MatchingPropertyWizardSnapshot = {
  title: string
  description: string
  addressLine: string
  zip: string
  city: string
  canton: string
  rooms: string
  areaSqm: string
  floor: string
  rentPerMonth: string
  availableFrom: string
  availableTo: string
  petPolicyNote: string
  allowPets: boolean
  status: 'draft' | 'active' | 'paused' | 'archived'
}

function prismaStatusToWizardStatus(s: MatchPropertyStatus): MatchingPropertyWizardSnapshot['status'] {
  return s as MatchingPropertyWizardSnapshot['status']
}

function dateToInputDate(d: Date | null | undefined): string {
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export async function loadMatchingPropertiesForLandlordUser(
  userId: string
): Promise<{ landlordAccountId: string | null; properties: MatchingPropertyListRow[] }> {
  const landlordAccountId = await getLandlordAccountIdForUser(userId)
  if (!landlordAccountId) {
    return { landlordAccountId: null, properties: [] }
  }

  const rows = await prisma.matchingProperty.findMany({
    where: { landlordAccountId },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      city: true,
      zip: true,
      canton: true,
      status: true,
      rentPerMonth: true,
      rooms: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  return {
    landlordAccountId,
    properties: rows.map(r => ({
      ...r,
      rooms: Number(r.rooms).toString(),
    })),
  }
}

export async function loadMatchingPropertyWizardSnapshotForOwner(
  userId: string,
  propertyId: string
): Promise<MatchingPropertyWizardSnapshot | null> {
  const landlordAccountId = await getLandlordAccountIdForUser(userId)
  if (!landlordAccountId) return null

  const p = await prisma.matchingProperty.findFirst({
    where: { id: propertyId, landlordAccountId },
    select: {
      title: true,
      description: true,
      addressLine: true,
      zip: true,
      city: true,
      canton: true,
      rooms: true,
      areaSqm: true,
      floor: true,
      rentPerMonth: true,
      availableFrom: true,
      availableTo: true,
      petPolicyNote: true,
      rulesJson: true,
      status: true,
    },
  })
  if (!p) return null

  const rules = parseLandlordRules(p.rulesJson)
  const allowPets = rules.allowPets !== false

  return {
    title: p.title,
    description: p.description ?? '',
    addressLine: p.addressLine ?? '',
    zip: p.zip,
    city: p.city,
    canton: p.canton,
    rooms: Number(p.rooms).toString(),
    areaSqm: p.areaSqm != null ? String(p.areaSqm) : '',
    floor: p.floor != null ? String(p.floor) : '',
    rentPerMonth: String(p.rentPerMonth),
    availableFrom: dateToInputDate(p.availableFrom),
    availableTo: dateToInputDate(p.availableTo),
    petPolicyNote: p.petPolicyNote ?? '',
    allowPets,
    status: prismaStatusToWizardStatus(p.status),
  }
}
