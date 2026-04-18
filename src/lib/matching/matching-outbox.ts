import { MatchingOutboxStatus, type Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function createMatchingOutboxJob(input: {
  type: string
  payload: Prisma.InputJsonValue
}): Promise<{ id: string }> {
  const row = await prisma.matchingOutboxEvent.create({
    data: {
      type: input.type,
      payload: input.payload,
      status: MatchingOutboxStatus.pending,
    },
    select: { id: true },
  })
  return { id: row.id }
}

export async function completeMatchingOutboxJob(
  id: string,
  payload: Prisma.InputJsonValue
): Promise<void> {
  await prisma.matchingOutboxEvent.update({
    where: { id },
    data: {
      status: MatchingOutboxStatus.completed,
      processedAt: new Date(),
      payload,
    },
  })
}

export async function failMatchingOutboxJob(id: string, lastError: string, payload?: Prisma.InputJsonValue) {
  await prisma.matchingOutboxEvent.update({
    where: { id },
    data: {
      status: MatchingOutboxStatus.failed,
      lastError: lastError.slice(0, 8000),
      ...(payload != null ? { payload } : {}),
    },
  })
}

/** Sofort fehlgeschlagenes Ereignis (z. B. fehlgeschlagene Neuberechnung) — ohne vorheriges `pending`. */
export async function recordMatchingJobFailure(input: {
  type: string
  payload: Prisma.InputJsonValue
  lastError: string
}): Promise<void> {
  try {
    await prisma.matchingOutboxEvent.create({
      data: {
        type: input.type,
        payload: input.payload,
        status: MatchingOutboxStatus.failed,
        lastError: input.lastError.slice(0, 8000),
      },
    })
  } catch (e) {
    console.error('[recordMatchingJobFailure]', e)
  }
}
