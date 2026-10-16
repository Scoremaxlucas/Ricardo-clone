import { isSicModuleId, normalizeSicModuleIds, roundSicChf } from '@/lib/sic/modules'

/**
 * AGB §7: Anteil einer bezahlten Angabe am belasteten Betrag.
 *
 * Seit dem Komplettpaket (eine Gebühr für Basis und alle Angaben) gibt es keinen
 * Einzelpreis pro Angabe mehr. Der erstattbare Anteil ist deshalb der gleiche
 * Bruchteil des tatsächlich bezahlten Betrags für jede Angabe auf der Zahlung
 * (Paket mit 4 Angaben: ein Viertel). Verlängerung hat keine modulweise Erstattung.
 */
export function sicModuleRefundAmountChf(opts: {
  amountPaidChf: number
  includeBaseFee: boolean
  isRenewal: boolean
  moduleKinds: unknown
  moduleKind: string
  alreadyRefundedChf?: number
}): number | null {
  if (opts.isRenewal) return null
  if (!isSicModuleId(opts.moduleKind)) return null
  if (!Number.isFinite(opts.amountPaidChf) || opts.amountPaidChf <= 0) return null

  const kinds = normalizeSicModuleIds(opts.moduleKinds)
  if (!kinds.includes(opts.moduleKind)) return null

  const share = opts.amountPaidChf / kinds.length

  const already = Number.isFinite(opts.alreadyRefundedChf) ? Math.max(0, opts.alreadyRefundedChf ?? 0) : 0
  const remaining = Math.max(0, opts.amountPaidChf - already)
  const amount = roundSicChf(Math.min(Math.max(0, share), remaining))
  return amount >= 0.01 ? amount : null
}

export function sicChfToStripeCents(chf: number): number {
  return Math.round(chf * 100)
}
