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

export const matchingPropertyWizardSchema = z.object({
  title: z.string().trim().min(3, 'Titel mindestens 3 Zeichen').max(200),
  description: z
    .string()
    .max(12000)
    .optional()
    .nullable()
    .transform(v => (v == null || v.trim() === '' ? null : v.trim())),
  addressLine: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform(v => (v == null || v.trim() === '' ? null : v.trim())),
  zip: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'PLZ muss 4 Ziffern sein'),
  city: z.string().trim().min(1, 'Ort erforderlich').max(120),
  canton: z
    .string()
    .trim()
    .length(2, 'Kanton 2 Buchstaben')
    .transform(s => s.toUpperCase())
    .refine(c => CH_CANTONS.has(c), 'Ungültiger Schweizer Kanton'),
  rooms: z.coerce.number().min(0.5).max(99),
  areaSqm: z.preprocess(
    v => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(1).max(2000).optional()
  ),
  floor: z.preprocess(
    v => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.number().int().min(-5).max(80).optional()
  ),
  rentPerMonth: z.coerce.number().int().min(1).max(500_000),
  availableFrom: z.coerce.date(),
  availableTo: z.preprocess(
    v => (v === '' || v === undefined || v === null ? undefined : v),
    z.coerce.date().optional()
  ),
  petPolicyNote: z
    .string()
    .max(4000)
    .optional()
    .nullable()
    .transform(v => (v == null || v.trim() === '' ? null : v.trim())),
  allowPets: z.boolean().default(true),
  status: z.enum(['draft', 'active']),
})

export type MatchingPropertyWizardInput = z.infer<typeof matchingPropertyWizardSchema>
