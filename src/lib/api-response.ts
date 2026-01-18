/**
 * Standardized API Response Utilities
 * Provides consistent error handling and response formatting across all API endpoints
 */
import { NextResponse } from 'next/server'

// ============================================
// RESPONSE TYPES
// ============================================

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data?: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================
// ERROR CODES
// ============================================

export const ErrorCodes = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNIQUE_CONSTRAINT: 'UNIQUE_CONSTRAINT',
  FOREIGN_KEY_ERROR: 'FOREIGN_KEY_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // External service errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',

  // Business logic errors
  AUCTION_ENDED: 'AUCTION_ENDED',
  INSUFFICIENT_BID: 'INSUFFICIENT_BID',
  SELF_BID: 'SELF_BID',
  ITEM_UNAVAILABLE: 'ITEM_UNAVAILABLE',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

// ============================================
// SUCCESS RESPONSES
// ============================================

export function success<T>(data?: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = { success: true }
  if (data !== undefined) response.data = data
  if (message) response.message = message
  return NextResponse.json(response)
}

export function created<T>(data?: T, message?: string): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = { success: true }
  if (data !== undefined) response.data = data
  if (message) response.message = message || 'Erfolgreich erstellt'
  return NextResponse.json(response, { status: 201 })
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 })
}

// ============================================
// ERROR RESPONSES
// ============================================

export function error(
  code: ErrorCode,
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  }
  return NextResponse.json(response, { status })
}

// Pre-built common error responses
export const errors = {
  unauthorized: (message = 'Nicht autorisiert. Bitte melden Sie sich an.') =>
    error(ErrorCodes.UNAUTHORIZED, message, 401),

  forbidden: (message = 'Zugriff verweigert.') =>
    error(ErrorCodes.FORBIDDEN, message, 403),

  notFound: (resource = 'Ressource') =>
    error(ErrorCodes.NOT_FOUND, `${resource} nicht gefunden`, 404),

  validationError: (message: string, details?: Record<string, unknown>) =>
    error(ErrorCodes.VALIDATION_ERROR, message, 400, details),

  invalidInput: (message: string) =>
    error(ErrorCodes.INVALID_INPUT, message, 400),

  missingField: (field: string) =>
    error(ErrorCodes.MISSING_FIELD, `${field} ist erforderlich`, 400),

  alreadyExists: (resource = 'Ressource') =>
    error(ErrorCodes.ALREADY_EXISTS, `${resource} existiert bereits`, 409),

  conflict: (message: string) =>
    error(ErrorCodes.CONFLICT, message, 409),

  rateLimited: (retryAfter?: number) =>
    error(
      ErrorCodes.RATE_LIMITED,
      'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
      429,
      retryAfter ? { retryAfter } : undefined
    ),

  databaseError: (message = 'Ein Datenbankfehler ist aufgetreten.') =>
    error(ErrorCodes.DATABASE_ERROR, message, 500),

  uniqueConstraint: (field: string) =>
    error(ErrorCodes.UNIQUE_CONSTRAINT, `${field} wird bereits verwendet`, 400),

  connectionError: () =>
    error(
      ErrorCodes.CONNECTION_ERROR,
      'Verbindungsfehler zur Datenbank. Bitte versuchen Sie es später erneut.',
      503
    ),

  externalServiceError: (service: string, message?: string) =>
    error(
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      message || `Fehler bei der Kommunikation mit ${service}`,
      502
    ),

  paymentError: (message = 'Ein Zahlungsfehler ist aufgetreten.') =>
    error(ErrorCodes.PAYMENT_ERROR, message, 402),

  auctionEnded: () =>
    error(ErrorCodes.AUCTION_ENDED, 'Die Auktion ist bereits beendet', 400),

  insufficientBid: (minBid: number) =>
    error(
      ErrorCodes.INSUFFICIENT_BID,
      `Das Gebot muss mindestens CHF ${minBid.toFixed(2)} betragen`,
      400
    ),

  selfBid: () =>
    error(ErrorCodes.SELF_BID, 'Sie können nicht auf Ihr eigenes Angebot bieten', 400),

  itemUnavailable: () =>
    error(ErrorCodes.ITEM_UNAVAILABLE, 'Dieser Artikel ist nicht mehr verfügbar', 410),

  internal: (message = 'Ein interner Fehler ist aufgetreten.') =>
    error(ErrorCodes.INTERNAL_ERROR, message, 500),

  serviceUnavailable: (message = 'Der Dienst ist vorübergehend nicht verfügbar.') =>
    error(ErrorCodes.SERVICE_UNAVAILABLE, message, 503),
}

// ============================================
// PRISMA ERROR HANDLER
// ============================================

/**
 * Handle Prisma errors and return appropriate API responses
 */
export function handlePrismaError(err: unknown): NextResponse<ApiErrorResponse> {
  const prismaError = err as { code?: string; meta?: { target?: string[] }; message?: string }

  // Unique constraint violation
  if (prismaError.code === 'P2002') {
    const targets = prismaError.meta?.target || []
    if (targets.includes('email')) {
      return errors.uniqueConstraint('E-Mail-Adresse')
    }
    if (targets.includes('nickname')) {
      return errors.uniqueConstraint('Nickname')
    }
    return errors.alreadyExists()
  }

  // Record not found
  if (prismaError.code === 'P2001' || prismaError.code === 'P2025') {
    return errors.notFound()
  }

  // Foreign key constraint failed
  if (prismaError.code === 'P2003') {
    return error(ErrorCodes.FOREIGN_KEY_ERROR, 'Ungültige Referenz', 400)
  }

  // Connection error
  if (
    prismaError.code === 'P1001' ||
    prismaError.code === 'P1002' ||
    prismaError.message?.toLowerCase().includes('connect') ||
    prismaError.message?.toLowerCase().includes('timeout')
  ) {
    return errors.connectionError()
  }

  // Column doesn't exist (schema mismatch)
  if (prismaError.code === 'P2022') {
    console.error('[API] Schema mismatch error:', prismaError)
    return errors.databaseError()
  }

  // Default database error
  if (prismaError.code?.startsWith('P')) {
    console.error('[API] Prisma error:', prismaError.code, prismaError.message)
    return errors.databaseError()
  }

  // Unknown error
  return errors.internal()
}

// ============================================
// TRY-CATCH WRAPPER
// ============================================

/**
 * Wrap an API handler with automatic error handling
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((err: unknown) => {
    console.error('[API] Unhandled error:', err)

    // Check if it's a Prisma error
    const prismaError = err as { code?: string }
    if (prismaError.code?.startsWith('P')) {
      return handlePrismaError(err)
    }

    // Generic error
    return errors.internal()
  })
}
