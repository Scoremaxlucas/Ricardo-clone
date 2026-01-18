/**
 * Database Transaction Utilities
 * 
 * Provides safe database transactions with automatic rollback on error
 * and typed return values.
 */

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Type for transaction client - matches Prisma's interactive transaction type
type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/**
 * Execute a function within a database transaction
 * Automatically rolls back on error
 * 
 * @example
 * const result = await withTransaction(async (tx) => {
 *   const user = await tx.user.create({ data: { email: 'test@test.com' } })
 *   const order = await tx.order.create({ data: { userId: user.id } })
 *   return { user, order }
 * })
 */
export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options?: {
    maxWait?: number // Maximum time to wait to acquire a database connection
    timeout?: number // Maximum time for the transaction to complete
    isolationLevel?: Prisma.TransactionIsolationLevel
  }
): Promise<T> {
  const defaultOptions = {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
    isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
  }
  
  const mergedOptions = { ...defaultOptions, ...options }
  
  return prisma.$transaction(fn, mergedOptions) as Promise<T>
}

/**
 * Execute multiple Prisma operations atomically
 * Use this for simple batch operations
 * 
 * @example
 * const [user, profile] = await batchTransaction([
 *   prisma.user.create({ data: { email: 'test@test.com' } }),
 *   prisma.profile.create({ data: { bio: 'Hello' } }),
 * ])
 */
export async function batchTransaction<T extends Prisma.PrismaPromise<unknown>[]>(
  operations: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  return prisma.$transaction(operations) as Promise<{ [K in keyof T]: Awaited<T[K]> }>
}

/**
 * Retry a database operation with exponential backoff
 * Useful for handling transient database errors
 * 
 * @example
 * const user = await retryOperation(
 *   () => prisma.user.create({ data: { email: 'test@test.com' } }),
 *   { maxRetries: 3 }
 * )
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number
    baseDelayMs?: number
    shouldRetry?: (error: unknown) => boolean
  }
): Promise<T> {
  const { 
    maxRetries = 3, 
    baseDelayMs = 100,
    shouldRetry = defaultShouldRetry 
  } = options || {}
  
  let lastError: unknown
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error
      }
      
      // Exponential backoff
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

/**
 * Default function to determine if an error is retryable
 */
function defaultShouldRetry(error: unknown): boolean {
  const prismaError = error as { code?: string; message?: string }
  
  // Connection errors are retryable
  if (prismaError.code === 'P1001' || prismaError.code === 'P1002') {
    return true
  }
  
  // Timeout errors are retryable
  if (
    prismaError.message?.toLowerCase().includes('timeout') ||
    prismaError.message?.toLowerCase().includes('connection')
  ) {
    return true
  }
  
  // Transaction conflict errors are retryable
  if (prismaError.code === 'P2034') {
    return true
  }
  
  return false
}

/**
 * Optimistic locking helper
 * Ensures data hasn't changed between read and write
 * 
 * @example
 * await optimisticUpdate(
 *   () => prisma.user.findUnique({ where: { id: '1' } }),
 *   (user) => user.version,
 *   (user) => prisma.user.update({
 *     where: { id: '1', version: user.version },
 *     data: { name: 'New Name', version: user.version + 1 }
 *   })
 * )
 */
export async function optimisticUpdate<T, V>(
  read: () => Promise<T | null>,
  getVersion: (data: T) => V,
  update: (data: T) => Promise<unknown>,
  maxRetries = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const data = await read()
    if (!data) {
      throw new Error('Record not found')
    }
    
    const version = getVersion(data)
    
    try {
      await update(data)
      return // Success
    } catch (error) {
      const prismaError = error as { code?: string }
      
      // P2025: Record not found (version mismatch in WHERE clause)
      if (prismaError.code === 'P2025' && attempt < maxRetries) {
        // Retry with fresh data
        continue
      }
      
      throw error
    }
  }
  
  throw new Error('Optimistic locking failed after max retries')
}

/**
 * Safe upsert that handles race conditions
 * First tries to update, then creates if not found
 */
export async function safeUpsert<T>(
  find: () => Promise<T | null>,
  create: () => Promise<T>,
  update: () => Promise<T>
): Promise<T> {
  try {
    const existing = await find()
    if (existing) {
      return await update()
    }
    return await create()
  } catch (error) {
    const prismaError = error as { code?: string }
    
    // Unique constraint violation - record was created in between
    if (prismaError.code === 'P2002') {
      return await update()
    }
    
    throw error
  }
}

/**
 * Execute a critical operation with proper locking
 * Prevents double processing of orders, payments, etc.
 */
export async function withLock<T>(
  lockKey: string,
  operation: () => Promise<T>,
  options?: {
    timeout?: number
    waitForLock?: boolean
  }
): Promise<T> {
  const { timeout = 30000, waitForLock = false } = options || {}
  
  // Use a simple database-based locking mechanism
  // In production, consider using Redis for distributed locking
  
  const lockId = `lock:${lockKey}`
  const lockExpiry = new Date(Date.now() + timeout)
  
  try {
    // Try to acquire lock
    await prisma.rateLimit.create({
      data: {
        identifier: lockId,
        createdAt: new Date(),
      },
    }).catch(async (error) => {
      const prismaError = error as { code?: string }
      
      if (prismaError.code === 'P2002') {
        // Lock exists - check if expired
        const existingLock = await prisma.rateLimit.findFirst({
          where: { identifier: lockId },
        })
        
        if (existingLock && existingLock.createdAt < new Date(Date.now() - timeout)) {
          // Lock expired, delete and retry
          await prisma.rateLimit.delete({ where: { id: existingLock.id } })
          await prisma.rateLimit.create({
            data: {
              identifier: lockId,
              createdAt: new Date(),
            },
          })
          return
        }
        
        if (!waitForLock) {
          throw new Error(`Lock ${lockKey} is already held`)
        }
        
        // Wait and retry (simplified - in production use proper polling)
        throw new Error(`Lock ${lockKey} is already held, waiting not implemented`)
      }
      
      throw error
    })
    
    // Execute operation
    return await operation()
  } finally {
    // Release lock
    await prisma.rateLimit.deleteMany({
      where: { identifier: lockId },
    }).catch(() => {
      // Ignore cleanup errors
    })
  }
}
