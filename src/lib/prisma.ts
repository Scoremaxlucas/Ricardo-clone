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
    // OPTIMIERT: Connection Pooling für maximale Performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // OPTIMIERT: Connection Pool Einstellungen für bessere Performance
    // Diese werden über DATABASE_URL Parameter gesetzt, aber hier dokumentiert:
    // ?connection_limit=10&pool_timeout=20 für optimale Performance
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
