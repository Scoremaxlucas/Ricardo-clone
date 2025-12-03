import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Erstelle neuen Prisma Client
// WICHTIG: In Development wird der Client gecacht, daher muss der Server
// nach Schema-Änderungen neu gestartet werden!
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // Optimize connection pool for better performance
    // These settings help reduce connection overhead
    __internal: {
      engine: {
        connectTimeout: 10000, // 10 seconds
      },
    },
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
