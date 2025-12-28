import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Debug: Log database connection status
const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('[Prisma] CRITICAL: DATABASE_URL is not set!')
} else {
  // Mask the password for logging
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':***@')
  console.log('[Prisma] Connecting to:', maskedUrl.substring(0, 80) + '...')
}

// Erstelle neuen Prisma Client mit Vercel Postgres Optimierungen
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error', 'warn'],
  })

// Cache the client in development only
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Test connection on startup
prisma
  .$connect()
  .then(() => {
    console.log('[Prisma] Successfully connected to database')
  })
  .catch((err) => {
    console.error('[Prisma] Failed to connect to database:', err)
  })
