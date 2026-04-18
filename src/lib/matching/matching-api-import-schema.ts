import { z } from 'zod'
import { matchingPropertyWizardSchema } from './property-wizard-schema'

/**
 * Striktes Request-DTO für `POST /api/matching/properties/import` (keine zusätzlichen Keys).
 */
export const matchingApiImportBodySchema = z
  .object({
    items: z.array(matchingPropertyWizardSchema).min(1).max(500),
  })
  .strict()

export type MatchingApiImportBody = z.infer<typeof matchingApiImportBodySchema>
