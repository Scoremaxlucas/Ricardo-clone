import { prisma } from '@/lib/prisma'
import { aggregateSicFunnel, type SicFunnelDays, type SicFunnelView } from '@/lib/sic/funnel'

export async function loadSicFunnel(days: SicFunnelDays): Promise<SicFunnelView> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [started, paid, created] = await Promise.all([
    prisma.sicPayment.findMany({
      where: { createdAt: { gte: since } },
      distinct: ['email'],
      select: { email: true },
    }),
    prisma.sicPayment.findMany({
      where: { status: { in: ['PAID', 'REFUNDED'] }, paidAt: { gte: since } },
      distinct: ['email'],
      select: { email: true },
    }),
    prisma.sicEvent.findMany({
      where: {
        kind: 'CERTIFICATE_CREATED',
        createdAt: { gte: since },
        certificateId: { not: null },
      },
      select: { certificateId: true, createdAt: true },
    }),
  ])

  const ids = Array.from(
    new Set(created.map(c => c.certificateId).filter((id): id is string => !!id)),
  )
  const followUp =
    ids.length === 0 ?
      []
    : await prisma.sicEvent.findMany({
        where: { certificateId: { in: ids } },
        select: { kind: true, certificateId: true, createdAt: true },
      })

  return aggregateSicFunnel({
    days,
    since,
    checkoutStarted: started.length,
    checkoutPaid: paid.length,
    created: created
      .filter((c): c is { certificateId: string; createdAt: Date } => !!c.certificateId)
      .map(c => ({ certificateId: c.certificateId, createdAt: c.createdAt })),
    followUp,
  })
}
