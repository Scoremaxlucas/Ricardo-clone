import type { prisma } from '@/lib/prisma'
import { isSicIdDocumentExpired, readSicFacts } from '@/lib/sic/facts'
import { addCalendarMonths } from '@/lib/sic/validity'
import type { SicModuleId } from '@/lib/sic/modules'

/**
 * Verlängerung heisst inhaltlich: frischer Betreibungsauszug. Dessen Alter ist
 * der Grund für die drei Monate Gültigkeit. Was nicht altert, bleibt stehen.
 *
 * - Betreibungsauszug: immer neu.
 * - Lohn & Arbeitsstelle: neu, wenn die Prüfung älter als ein Jahr ist.
 * - Ausweis: neu, nur wenn er abgelaufen ist.
 * - Referenz vom Vermieter: betrifft die Vergangenheit, bleibt dauerhaft.
 */
export const SIC_EMPLOYMENT_RECHECK_MONTHS = 12

export type RenewalModuleInput = {
  moduleKind: SicModuleId
  status: string
  reviewedAt: Date | null
  verifiedFacts?: unknown
}

/** Welche der vorhandenen Module eine Verlängerung zurück auf «Unterlagen fehlen» setzt. */
export function modulesResetByRenewal(modules: RenewalModuleInput[], now = new Date()): SicModuleId[] {
  const reset: SicModuleId[] = []

  for (const m of modules) {
    if (m.moduleKind === 'BONITAET') {
      reset.push(m.moduleKind)
      continue
    }
    if (m.moduleKind === 'ARBEIT_EINKOMMEN') {
      const staleFrom = m.reviewedAt ? addCalendarMonths(m.reviewedAt, SIC_EMPLOYMENT_RECHECK_MONTHS) : null
      if (!staleFrom || staleFrom.getTime() <= now.getTime()) reset.push(m.moduleKind)
      continue
    }
    if (m.moduleKind === 'AUFENTHALT') {
      const facts = readSicFacts('AUFENTHALT', m.verifiedFacts)
      if (isSicIdDocumentExpired(facts, now)) reset.push(m.moduleKind)
      continue
    }
    // ZUVERLAESSIGKEIT bleibt.
  }

  return reset
}

/**
 * Diese Angaben altern nur, sie werden nicht falsch: bei einer frühzeitigen
 * Verlängerung bleiben ihre Werte sichtbar, bis der neue Nachweis geprüft ist.
 * Ein abgelaufener Ausweis gilt dagegen sofort nicht mehr.
 */
export function sicRenewalCarriesFacts(id: SicModuleId): boolean {
  return id === 'BONITAET' || id === 'ARBEIT_EINKOMMEN'
}

/**
 * Läuft eine bezahlte Verlängerung noch? So lange, bis nach der Zahlung ein neuer
 * Betreibungsauszug freigegeben wurde. In der Zeit gibt es keine zweite
 * Verlängerung — weder im Checkout noch bei der Erfüllung.
 */
export function isSicRenewalPending(opts: {
  bonitaetStatus: string | null
  /** Letzte Freigabe des Betreibungsauszugs (Ereignis), null = nie. */
  lastBonitaetVerifiedAt: Date | null
  renewalPaidAts: (Date | null)[]
}): boolean {
  // Ohne Betreibungs-Angabe (erstattet) gibt es nichts, worauf eine Verlängerung wartet.
  if (opts.bonitaetStatus === null || opts.bonitaetStatus === 'VERIFIED') return false
  const since = opts.lastBonitaetVerifiedAt?.getTime() ?? 0
  return opts.renewalPaidAts.some(d => !!d && d.getTime() > since)
}

type RenewalPendingDb = Pick<typeof prisma, 'sicCertificateModule' | 'sicEvent' | 'sicPayment'>

export async function loadSicRenewalPending(
  db: RenewalPendingDb,
  certificateId: string,
  opts?: { excludePaymentId?: string }
): Promise<boolean> {
  const [bonitaet, lastVerified, renewals] = await Promise.all([
    db.sicCertificateModule.findUnique({
      where: { certificateId_moduleKind: { certificateId, moduleKind: 'BONITAET' } },
      select: { status: true },
    }),
    db.sicEvent.findFirst({
      where: { certificateId, kind: 'MODULE_VERIFIED', moduleKind: 'BONITAET' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
    db.sicPayment.findMany({
      where: {
        certificateId,
        isRenewal: true,
        status: 'PAID',
        ...(opts?.excludePaymentId ? { id: { not: opts.excludePaymentId } } : {}),
      },
      select: { paidAt: true },
    }),
  ])
  return isSicRenewalPending({
    bonitaetStatus: bonitaet?.status ?? null,
    lastBonitaetVerifiedAt: lastVerified?.createdAt ?? null,
    renewalPaidAts: renewals.map(r => r.paidAt),
  })
}
