/**
 * Input Validation Schemas using Zod
 * Centralized validation for API endpoints and forms
 */
import { z } from 'zod'

// ============================================
// COMMON VALIDATION HELPERS
// ============================================

// Swiss phone number format (optional international format)
const swissPhoneRegex = /^(\+41|0041|0)?[0-9]{9}$/

// Password requirements
const passwordSchema = z
  .string()
  .min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
  .regex(/\d/, 'Das Passwort muss mindestens eine Zahl enthalten')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Das Passwort muss mindestens ein Sonderzeichen enthalten'
  )

// Email validation
const emailSchema = z
  .string()
  .email('Bitte geben Sie eine gültige E-Mail-Adresse ein')
  .transform((val) => val.trim().toLowerCase())

// Nickname validation
const nicknameSchema = z
  .string()
  .min(6, 'Nickname muss mindestens 6 Zeichen lang sein')
  .max(30, 'Nickname darf maximal 30 Zeichen lang sein')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Nickname darf nur Buchstaben, Zahlen, _ und - enthalten')
  .transform((val) => val.trim())

// Swiss postal code
const postalCodeSchema = z
  .string()
  .regex(/^[0-9]{4}$/, 'Bitte geben Sie eine gültige Schweizer Postleitzahl ein')

// Price validation (CHF)
const priceSchema = z
  .number()
  .min(0, 'Preis muss mindestens 0 sein')
  .max(9999999, 'Preis ist zu hoch')

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Vorname ist erforderlich')
    .max(50, 'Vorname darf maximal 50 Zeichen lang sein')
    .transform((val) => val.trim()),
  lastName: z
    .string()
    .min(1, 'Nachname ist erforderlich')
    .max(50, 'Nachname darf maximal 50 Zeichen lang sein')
    .transform((val) => val.trim()),
  nickname: nicknameSchema,
  email: emailSchema,
  password: passwordSchema,
  marketingConsent: z.boolean().optional().default(false),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Passwort ist erforderlich'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token ist erforderlich'),
  password: passwordSchema,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: passwordSchema,
})

// ============================================
// CONTACT SCHEMAS
// ============================================

export const contactSchema = z.object({
  category: z.enum(['technical', 'account', 'payment', 'safety', 'general', 'feedback', 'other'], {
    errorMap: () => ({ message: 'Bitte wählen Sie eine Kategorie' }),
  }),
  email: emailSchema,
  subject: z
    .string()
    .min(3, 'Betreff muss mindestens 3 Zeichen lang sein')
    .max(200, 'Betreff darf maximal 200 Zeichen lang sein')
    .transform((val) => val.trim()),
  message: z
    .string()
    .min(10, 'Nachricht muss mindestens 10 Zeichen lang sein')
    .max(5000, 'Nachricht darf maximal 5000 Zeichen lang sein')
    .transform((val) => val.trim()),
})

// ============================================
// BID SCHEMAS
// ============================================

export const bidSchema = z
  .object({
    watchId: z.string().min(1, 'Watch ID ist erforderlich'),
    amount: z.number().optional(),
    isBuyNow: z.boolean().optional().default(false),
    isMaxBid: z.boolean().optional().default(false),
    maxAmount: z.number().optional(),
  })
  .refine(
    (data) => {
      // Either amount or (isMaxBid && maxAmount) must be provided
      if (data.isBuyNow) return true
      if (data.isMaxBid && data.maxAmount && data.maxAmount > 0) return true
      if (data.amount && data.amount > 0) return true
      return false
    },
    {
      message: 'Betrag ist erforderlich',
    }
  )

// ============================================
// WATCH/LISTING SCHEMAS
// ============================================

export const watchSchema = z.object({
  title: z
    .string()
    .min(5, 'Titel muss mindestens 5 Zeichen lang sein')
    .max(80, 'Titel darf maximal 80 Zeichen lang sein')
    .transform((val) => val.trim()),
  description: z
    .string()
    .min(20, 'Beschreibung muss mindestens 20 Zeichen lang sein')
    .max(10000, 'Beschreibung darf maximal 10000 Zeichen lang sein')
    .transform((val) => val.trim()),
  brand: z
    .string()
    .min(1, 'Marke ist erforderlich')
    .max(100)
    .transform((val) => val.trim()),
  model: z
    .string()
    .max(100)
    .optional()
    .transform((val) => val?.trim()),
  referenceNumber: z
    .string()
    .max(100)
    .optional()
    .transform((val) => val?.trim()),
  year: z.number().min(1800).max(new Date().getFullYear() + 1).optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
  price: priceSchema,
  buyNowPrice: priceSchema.optional(),
  auctionType: z.enum(['fixed_price', 'auction', 'hybrid']).default('fixed_price'),
  duration: z.number().min(1).max(30).optional(),
  location: z
    .string()
    .max(100)
    .optional()
    .transform((val) => val?.trim()),
  postalCode: postalCodeSchema.optional(),
})

// ============================================
// ADDRESS SCHEMAS
// ============================================

export const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']),
  street: z
    .string()
    .min(1, 'Strasse ist erforderlich')
    .max(200)
    .transform((val) => val.trim()),
  houseNumber: z
    .string()
    .max(20)
    .optional()
    .transform((val) => val?.trim()),
  additionalInfo: z
    .string()
    .max(200)
    .optional()
    .transform((val) => val?.trim()),
  postalCode: postalCodeSchema,
  city: z
    .string()
    .min(1, 'Ort ist erforderlich')
    .max(100)
    .transform((val) => val.trim()),
  country: z.string().default('CH'),
})

// ============================================
// ORDER SCHEMAS
// ============================================

export const orderSchema = z.object({
  watchId: z.string().min(1, 'Watch ID ist erforderlich'),
  deliveryMode: z.enum(['shipping', 'pickup']),
  paymentMethod: z.enum(['stripe', 'twint', 'bank_transfer', 'cash']),
  shippingAddressId: z.string().optional(),
})

// ============================================
// REVIEW SCHEMAS
// ============================================

export const reviewSchema = z.object({
  rating: z.number().min(1, 'Bewertung ist erforderlich').max(5, 'Bewertung darf maximal 5 sein'),
  comment: z
    .string()
    .max(2000, 'Kommentar darf maximal 2000 Zeichen lang sein')
    .optional()
    .transform((val) => val?.trim()),
  isPositive: z.boolean().optional(),
})

// ============================================
// REPORT SCHEMAS
// ============================================

export const reportSchema = z.object({
  reason: z.enum([
    'spam',
    'fake',
    'prohibited',
    'counterfeit',
    'misleading',
    'stolen',
    'price_manipulation',
    'other',
  ]),
  description: z
    .string()
    .min(10, 'Beschreibung muss mindestens 10 Zeichen lang sein')
    .max(2000, 'Beschreibung darf maximal 2000 Zeichen lang sein')
    .transform((val) => val.trim()),
})

// ============================================
// SEARCH SCHEMAS
// ============================================

export const searchSchema = z.object({
  query: z
    .string()
    .max(200, 'Suchanfrage ist zu lang')
    .optional()
    .transform((val) => val?.trim()),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  brand: z.string().optional(),
  condition: z.string().optional(),
  location: z.string().optional(),
  sortBy: z.enum(['relevance', 'price_asc', 'price_desc', 'date_asc', 'date_desc']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(24),
})

// ============================================
// SANITIZATION HELPERS
// ============================================

/**
 * Sanitize HTML-like content to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate and parse request body with a Zod schema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body)
  if (result.success) {
    return { success: true, data: result.data }
  }
  // Format error messages
  const errorMessages = result.error.errors.map((err) => err.message).join('. ')
  return { success: false, error: errorMessages }
}

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ContactInput = z.infer<typeof contactSchema>
export type BidInput = z.infer<typeof bidSchema>
export type WatchInput = z.infer<typeof watchSchema>
export type AddressInput = z.infer<typeof addressSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type ReviewInput = z.infer<typeof reviewSchema>
export type ReportInput = z.infer<typeof reportSchema>
export type SearchInput = z.infer<typeof searchSchema>
