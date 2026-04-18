import { z } from 'zod'

const CH_CANTONS = new Set([
  'AG',
  'AI',
  'AR',
  'BE',
  'BL',
  'BS',
  'FR',
  'GE',
  'GL',
  'GR',
  'JU',
  'LU',
  'NE',
  'NW',
  'OW',
  'SG',
  'SH',
  'SO',
  'SZ',
  'TG',
  'TI',
  'UR',
  'VD',
  'VS',
  'ZG',
  'ZH',
])

const emptyToUndef = (arg: unknown) => {
  const s = arg as string | undefined | null
  const t = s?.trim()
  return t === '' || t == null ? undefined : t
}

export const seekerSearchStepSchema = z
  .object({
    cantonPreference: z.preprocess(
      emptyToUndef,
      z
        .string()
        .length(2, 'Kanton 2 Buchstaben')
        .transform(s => s.toUpperCase())
        .refine(c => CH_CANTONS.has(c), 'Ungültiger Schweizer Kanton')
        .optional()
    ),
    postalCodesWanted: z.preprocess(
      v => (v === '' || v === undefined || v === null ? null : String(v).trim()),
      z.string().max(2000).nullable().optional()
    ),
    budgetMin: z.preprocess(
      v => (v === '' || v === undefined || v === null ? undefined : v),
      z.coerce.number().int().min(0).max(500_000).optional()
    ),
    budgetMax: z.preprocess(
      v => (v === '' || v === undefined || v === null ? undefined : v),
      z.coerce.number().int().min(0).max(500_000).optional()
    ),
    minRooms: z.preprocess(
      v => (v === '' || v === undefined || v === null ? undefined : v),
      z.coerce.number().min(0.5).max(99).optional()
    ),
    maxRooms: z.preprocess(
      v => (v === '' || v === undefined || v === null ? undefined : v),
      z.coerce.number().min(0.5).max(99).optional()
    ),
    moveInEarliest: z.preprocess(
      v => (v === '' || v === undefined || v === null ? undefined : v),
      z.coerce.date().optional()
    ),
    moveInLatest: z.preprocess(
      v => (v === '' || v === undefined || v === null ? undefined : v),
      z.coerce.date().optional()
    ),
  })
  .refine(
    d => Boolean(d.cantonPreference?.trim()) || Boolean(d.postalCodesWanted?.trim()),
    'Bitte Kanton oder PLZ-Liste angeben.'
  )
  .refine(d => d.budgetMin != null || d.budgetMax != null, 'Bitte mindestens ein Budgetfeld ausfüllen.')
  .refine(d => d.minRooms != null || d.maxRooms != null, 'Bitte Zimmer-Spanne angeben (min und/oder max).')

export type SeekerSearchStepInput = z.infer<typeof seekerSearchStepSchema>

export const seekerHouseholdStepSchema = z.object({
  adults: z.coerce.number().int().min(1).max(12),
  children: z.coerce.number().int().min(0).max(12),
  petsDescription: z.preprocess(
    v => (v === '' || v === undefined || v === null ? null : String(v).trim()),
    z.string().max(4000).nullable().optional()
  ),
})

export type SeekerHouseholdStepInput = z.infer<typeof seekerHouseholdStepSchema>

export const seekerEmploymentStepSchema = z.object({
  employmentStatus: z.preprocess(
    emptyToUndef,
    z.string().trim().max(120).optional()
  ),
  employerName: z.preprocess(
    emptyToUndef,
    z.string().trim().max(200).optional()
  ),
})

export type SeekerEmploymentStepInput = z.infer<typeof seekerEmploymentStepSchema>

export const seekerFinancialStepSchema = z.object({
  monthlyNetIncomeBand: z.preprocess(
    emptyToUndef,
    z.string().trim().max(120).optional()
  ),
})

export type SeekerFinancialStepInput = z.infer<typeof seekerFinancialStepSchema>
