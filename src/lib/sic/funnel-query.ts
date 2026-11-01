import { prisma } from '@/lib/prisma'
import { SIC_INCOME_GROUPS } from '@/lib/sic/facts'
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

/**
 * Wer «nicht angestellt» vermerkt hat, über alle Zertifikate. Zeigt, für welche Gruppe
 * sich ein eigener Einkommensnachweis lohnt. Widerrufene zählen nicht.
 */
export async function loadSicIncomeGroupCounts(): Promise<{ group: string; label: string; count: number }[]> {
  const rows = await prisma.sicCertificateModule.findMany({
    where: { moduleKind: 'ARBEIT_EINKOMMEN', status: 'NOT_APPLICABLE', certificate: { status: { not: 'REVOKED' } } },
    select: { verifiedFacts: true },
  })
  const counts = new Map<string, number>()
  for (const row of rows) {
    const facts = row.verifiedFacts as Record<string, unknown> | null
    const group = typeof facts?.incomeGroup === 'string' ? facts.incomeGroup : ''
    counts.set(group, (counts.get(group) ?? 0) + 1)
  }
  return SIC_INCOME_GROUPS.map(g => ({ group: g.value, label: g.label, count: counts.get(g.value) ?? 0 }))
}
