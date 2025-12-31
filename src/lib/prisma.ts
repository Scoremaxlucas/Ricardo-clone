import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

import { isDebug } from './env'

// Create Prisma client with appropriate logging
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDebug() ? ['error', 'warn'] : ['error'],
  })

// Cache the client in development to prevent hot-reload issues
if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
