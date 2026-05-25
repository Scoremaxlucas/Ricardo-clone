import { externalLandlordDisplayName } from '@/lib/external-landlords/crm'
import { prisma } from '@/lib/prisma'

export type ExternalLandlordOption = {
  id: string
  label: string
  secondary: string | null
}

export async function loadExternalLandlordOptions(limit = 400): Promise<ExternalLandlordOption[]> {
  const rows = await prisma.externalLandlord.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      displayName: true,
      normalizedPrimaryEmail: true,
      normalizedPrimaryPhone: true,
    },
  })

  return rows.map(row => ({
    id: row.id,
    label: externalLandlordDisplayName(
      row.displayName,
      row.normalizedPrimaryEmail,
      row.normalizedPrimaryPhone
    ),
    secondary: [row.normalizedPrimaryEmail, row.normalizedPrimaryPhone].filter(Boolean).join(' · ') || null,
  }))
}
