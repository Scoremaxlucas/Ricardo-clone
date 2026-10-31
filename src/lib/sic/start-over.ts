import { prisma } from '@/lib/prisma'

/**
 * Neu anlegen nach Widerruf: nur, wenn keine Zahlung mehr gilt (volle Erstattung,
 * Rückbuchung). Ein Widerruf wegen Missbrauchs (§8) lässt die Zahlung PAID — dann nicht.
 */
export async function sicRevokedCanStartOver(certificateId: string): Promise<boolean> {
  const paid = await prisma.sicPayment.count({ where: { certificateId, status: 'PAID' } })
  return paid === 0
}
