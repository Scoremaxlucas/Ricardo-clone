import { Prisma } from '@prisma/client'
import { sendRentalApplicantSuccessEmail } from '@/lib/rental/emails'
import { prisma } from '@/lib/prisma'

/** Payload für `sendRentalApplicantSuccessEmail` (JSON in Outbox). */
export type TenantApplicationConfirmPayload = {
  applicantEmail: string
  applicantUserId: string
  applicantFirst: { firstName?: string | null; name?: string | null; nickname?: string | null }
  listingTitle: string
  addressLine: string
  rooms: number
  rentPerMonth: number
}

export async function enqueueTenantApplicationConfirmEmail(params: {
  rentalApplicationId: string
  applicantUserId: string
  payload: TenantApplicationConfirmPayload
}): Promise<void> {
  const dedupeKey = `tenant-app-confirm:${params.rentalApplicationId}`
  try {
    await prisma.wohnenEmailOutbox.create({
      data: {
        kind: 'TENANT_APPLICATION_CONFIRM',
        dedupeKey,
        status: 'pending',
        nextAttemptAt: new Date(),
        payload: params.payload as object,
        rentalApplicationId: params.rentalApplicationId,
        applicantUserId: params.applicantUserId,
      },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return
    }
    throw e
  }
}

export async function processWohnenEmailOutboxBatch(limit = 20): Promise<{
  processed: number
  failed: number
}> {
  const now = new Date()
  const rows = await prisma.wohnenEmailOutbox.findMany({
    where: {
      status: { in: ['pending', 'failed'] },
      nextAttemptAt: { lte: now },
      attempts: { lt: 10 },
    },
    orderBy: { nextAttemptAt: 'asc' },
    take: limit,
  })

  let processed = 0
  let failed = 0

  for (const row of rows) {
    const result = await processWohnenEmailOutboxRow(row)
    if (result.ok) processed += 1
    else failed += 1
  }

  return { processed, failed }
}

async function processWohnenEmailOutboxRow(row: {
  id: string
  kind: string
  payload: unknown
  attempts: number
}) {
  try {
    await prisma.wohnenEmailOutbox.update({
      where: { id: row.id },
      data: { status: 'sending' },
    })

    if (row.kind === 'TENANT_APPLICATION_CONFIRM') {
      const p = row.payload as TenantApplicationConfirmPayload
      await sendRentalApplicantSuccessEmail({
        applicantEmail: p.applicantEmail,
        applicantUserId: p.applicantUserId,
        applicantFirst: p.applicantFirst,
        listingTitle: p.listingTitle,
        addressLine: p.addressLine,
        rooms: p.rooms,
        rentPerMonth: p.rentPerMonth,
      })
    }

    await prisma.wohnenEmailOutbox.update({
      where: { id: row.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        lastError: null,
      },
    })
    return { ok: true as const }
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 900) : 'unknown'
    const backoffMs = Math.min(3_600_000, 45_000 * Math.pow(2, row.attempts))
    await prisma.wohnenEmailOutbox.update({
      where: { id: row.id },
      data: {
        status: 'failed',
        attempts: { increment: 1 },
        lastError: msg,
        nextAttemptAt: new Date(Date.now() + backoffMs),
      },
    })
    return { ok: false as const, error: msg }
  }
}

export async function processWohnenEmailOutboxRowNow(id: string): Promise<
  | { ok: true; status: 'sent' }
  | { ok: false; status: 'not_found' | 'terminal' | 'failed'; error?: string }
> {
  const row = await prisma.wohnenEmailOutbox.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      payload: true,
      attempts: true,
      status: true,
    },
  })
  if (!row) return { ok: false, status: 'not_found' }
  if (row.status === 'sent' || row.status === 'cancelled') {
    return { ok: false, status: 'terminal' }
  }

  await prisma.wohnenEmailOutbox.update({
    where: { id: row.id },
    data: {
      status: 'pending',
      nextAttemptAt: new Date(),
    },
  })

  const result = await processWohnenEmailOutboxRow({
    id: row.id,
    kind: row.kind,
    payload: row.payload,
    attempts: row.attempts,
  })
  if (result.ok) return { ok: true, status: 'sent' }
  return { ok: false, status: 'failed', error: result.error }
}
