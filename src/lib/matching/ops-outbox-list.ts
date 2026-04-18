import { prisma } from '@/lib/prisma'

export async function loadRecentMatchingOutboxEvents(take = 150) {
  return prisma.matchingOutboxEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      processedAt: true,
      attempts: true,
      lastError: true,
      payload: true,
    },
  })
}
