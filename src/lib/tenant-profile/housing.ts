import type { CurrentHousingSituation } from '@prisma/client'

export const CURRENT_HOUSING_SITUATIONS: CurrentHousingSituation[] = [
  'RENTAL',
  'OWNERSHIP',
  'SUBLET',
  'OTHER',
]

export function isCurrentHousingSituation(v: string): v is CurrentHousingSituation {
  return (CURRENT_HOUSING_SITUATIONS as string[]).includes(v)
}

export function housingSituationLabelDe(s: CurrentHousingSituation): string {
  switch (s) {
    case 'RENTAL':
      return 'Mietwohnung'
    case 'OWNERSHIP':
      return 'Eigentum'
    case 'SUBLET':
      return 'Untermiete bei Dritten'
    case 'OTHER':
      return 'Sonstiges'
  }
}

export function housingSinceLabelDe(d: Date): string {
  return d.toLocaleDateString('de-CH', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function housingSituationLineDe(
  situation: CurrentHousingSituation | null | undefined,
  since: Date | null | undefined
): string | null {
  if (!situation) return null
  const label = housingSituationLabelDe(situation)
  if (!since || Number.isNaN(since.getTime())) return label
  return `${label} · an dieser Adresse seit ${housingSinceLabelDe(since)}`
}
