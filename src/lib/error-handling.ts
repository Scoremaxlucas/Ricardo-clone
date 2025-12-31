/**
 * Zentrale Error-Handling Utilities
 *
 * Bietet konsistente Fehlerbehandlung und Logging für Stripe-Operationen
 */

import { shouldLogStackTraces, shouldShowDetailedErrors } from './env'

export interface StripeError extends Error {
  type?: string
  code?: string
  decline_code?: string
  param?: string
  statusCode?: number
}

/**
 * Formatiert einen Stripe-Fehler für Logging
 */
export function formatStripeError(error: any): string {
  if (error?.type && error?.code) {
    return `Stripe ${error.type}: ${error.code} - ${error.message || 'Unknown error'}`
  }
  return error?.message || 'Unknown error'
}

/**
 * Prüft ob ein Fehler ein Stripe-Fehler ist
 */
export function isStripeError(error: any): error is StripeError {
  return error && (error.type || error.code || error.statusCode)
}

/**
 * Prüft ob ein Fehler ein Idempotency-Fehler ist (sollte ignoriert werden)
 */
export function isIdempotencyError(error: any): boolean {
  if (isStripeError(error)) {
    // Stripe Idempotency-Fehler haben oft spezifische Codes
    return (
      error.code === 'idempotency_key_reused' ||
      error.message?.includes('idempotency') ||
      error.message?.includes('already processed')
    )
  }
  return false
}

/**
 * Prüft ob ein Fehler ein "bereits existiert"-Fehler ist (sollte ignoriert werden)
 */
export function isAlreadyExistsError(error: any): boolean {
  const message = error?.message?.toLowerCase() || ''
  return (
    message.includes('already exists') ||
    message.includes('bereits vorhanden') ||
    message.includes('duplicate') ||
    message.includes('unique constraint')
  )
}

/**
 * Loggt einen Fehler konsistent
 */
export function logError(context: string, error: any, details?: Record<string, any>): void {
  const errorMessage = isStripeError(error)
    ? formatStripeError(error)
    : error?.message || 'Unknown error'

  console.error(`[${context}] Fehler:`, errorMessage)

  if (details) {
    console.error(`[${context}] Details:`, details)
  }

  if (error?.stack && shouldLogStackTraces()) {
    console.error(`[${context}] Stack:`, error.stack)
  }
}

/**
 * Erstellt eine sichere Error-Response für API-Routes
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  error?: any
): Response {
  const response: any = {
    success: false,
    message,
  }

  // Nur im Debug-Modus: Zeige detaillierte Fehlerinfos
  if (shouldShowDetailedErrors() && error) {
    response.error = isStripeError(error) ? formatStripeError(error) : error.message
  }

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Wrapper für sichere async Operationen mit Error-Handling
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T | null> {
  try {
    return await operation()
  } catch (error: any) {
    logError(context, error)

    // Idempotency-Fehler sind nicht kritisch
    if (isIdempotencyError(error)) {
      console.log(`[${context}] Idempotency-Fehler ignoriert`)
      return fallback || null
    }

    // "Bereits existiert"-Fehler sind nicht kritisch
    if (isAlreadyExistsError(error)) {
      console.log(`[${context}] "Bereits existiert"-Fehler ignoriert`)
      return fallback || null
    }

    // Andere Fehler weiterwerfen
    throw error
  }
}
