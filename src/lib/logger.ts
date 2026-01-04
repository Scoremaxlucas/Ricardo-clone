/**
 * Logging Framework for Helvenda
 *
 * Structured logging using Pino for better debugging and monitoring.
 *
 * Usage:
 *   import { logger } from '@/lib/logger'
 *   logger.info('User logged in', { userId: '123' })
 *   logger.error('Payment failed', { error, orderId })
 *
 * Log Levels:
 *   - fatal: System is unusable
 *   - error: Error conditions
 *   - warn: Warning conditions
 *   - info: Informational messages
 *   - debug: Debug-level messages
 *   - trace: Very detailed tracing
 */

import pino, { Logger } from 'pino'

// Determine log level based on environment
const getLogLevel = (): string => {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL
  if (process.env.NODE_ENV === 'production') return 'info'
  if (process.env.NODE_ENV === 'test') return 'silent'
  return 'debug'
}

// Create base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: getLogLevel(),
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'helvenda',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: label => ({ level: label }),
  },
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'passwordHash',
      'token',
      'accessToken',
      'refreshToken',
      'apiKey',
      'secret',
      'creditCard',
      'iban',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
}

// Create the logger instance
// In development, use pino-pretty for readable output
// In production, use JSON format for log aggregation tools
const createLogger = (): Logger => {
  // Server-side only - use pino directly
  if (typeof window === 'undefined') {
    // In development, use pretty printing
    if (process.env.NODE_ENV !== 'production') {
      return pino({
        ...baseConfig,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname,env,service',
          },
        },
      })
    }
    // In production, use standard JSON output
    return pino(baseConfig)
  }

  // Client-side - create a mock logger that uses console
  return {
    fatal: (obj: unknown, msg?: string) => console.error('[FATAL]', msg || obj, obj),
    error: (obj: unknown, msg?: string) => console.error('[ERROR]', msg || obj, obj),
    warn: (obj: unknown, msg?: string) => console.warn('[WARN]', msg || obj, obj),
    info: (obj: unknown, msg?: string) => console.info('[INFO]', msg || obj, obj),
    debug: (obj: unknown, msg?: string) => console.debug('[DEBUG]', msg || obj, obj),
    trace: (obj: unknown, msg?: string) => console.trace('[TRACE]', msg || obj, obj),
    child: () => createLogger(),
    level: 'info',
  } as unknown as Logger
}

// Export the main logger instance
export const logger = createLogger()

// Export typed child logger factory
export function createChildLogger(context: Record<string, unknown>): Logger {
  return logger.child(context)
}

// Convenience loggers for specific domains
export const apiLogger = logger.child({ domain: 'api' })
export const authLogger = logger.child({ domain: 'auth' })
export const paymentLogger = logger.child({ domain: 'payment' })
export const emailLogger = logger.child({ domain: 'email' })
export const searchLogger = logger.child({ domain: 'search' })
export const auctionLogger = logger.child({ domain: 'auction' })

/**
 * Request logging middleware helper
 *
 * Usage in API routes:
 *   const log = logRequest(request)
 *   log.info('Processing payment')
 */
export function logRequest(
  request: Request,
  additionalContext?: Record<string, unknown>
): Logger {
  const url = new URL(request.url)
  return apiLogger.child({
    method: request.method,
    path: url.pathname,
    ...additionalContext,
  })
}

/**
 * Performance timing helper
 *
 * Usage:
 *   const timer = startTimer('database-query')
 *   await db.query(...)
 *   timer.end() // Logs: "database-query completed in 45ms"
 */
export function startTimer(operation: string, context?: Record<string, unknown>) {
  const start = performance.now()
  const log = logger.child({ operation, ...context })

  return {
    end: (additionalContext?: Record<string, unknown>) => {
      const duration = Math.round(performance.now() - start)
      log.info({ duration, ...additionalContext }, `${operation} completed in ${duration}ms`)
      return duration
    },
    fail: (error: Error, additionalContext?: Record<string, unknown>) => {
      const duration = Math.round(performance.now() - start)
      log.error(
        { duration, error: error.message, stack: error.stack, ...additionalContext },
        `${operation} failed after ${duration}ms`
      )
      return duration
    },
  }
}

/**
 * Error logging helper with context
 */
export function logError(
  error: Error | unknown,
  message: string,
  context?: Record<string, unknown>
): void {
  if (error instanceof Error) {
    logger.error(
      {
        error: error.message,
        stack: error.stack,
        name: error.name,
        ...context,
      },
      message
    )
  } else {
    logger.error({ error, ...context }, message)
  }
}

// Default export for convenience
export default logger
