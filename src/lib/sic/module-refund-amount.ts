import { isSicModuleId, normalizeSicModuleIds, roundSicChf } from '@/lib/sic/modules'
import { quoteSicOrder } from '@/lib/sic/pricing'

/**
 * AGB §7: Anteil einer bezahlten Angabe am Stripe-Betrag.
 *
 * Basisgebühr bleibt beim Zertifikat. Stripe-Mindestbetrag hängt an den Angaben,
 * nicht an der Basis — bei nur einer Angabe auf der Zahlung geht der Rest
 * (inkl. Minimum) an diese Angabe. Verlängerung hat keine modulweise Erstattung.
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

  const quote = quoteSicOrder({ includeBaseFee: opts.includeBaseFee, moduleIds: kinds })
  const moduleLine = quote.lines.find(l => l.kind === 'module' && l.moduleId === opts.moduleKind)
  if (!moduleLine) return null

  const moduleLines = quote.lines.filter(l => l.kind === 'module')
  const discountAbs = Math.abs(quote.lines.find(l => l.kind === 'discount')?.amountChf ?? 0)
  const minimum = quote.lines.find(l => l.kind === 'minimum')?.amountChf ?? 0
  const base = quote.lines.find(l => l.kind === 'base')?.amountChf ?? 0
  const moduleSum = moduleLines.reduce((sum, l) => sum + l.amountChf, 0)
  const positiveSum = moduleSum + base
  if (positiveSum <= 0) return null

  const scale = quote.totalChf > 0 ? opts.amountPaidChf / quote.totalChf : 1
  const baseNet = (base / positiveSum) * (positiveSum - discountAbs)

  let share: number
  if (moduleLines.length === 1) {
    share = opts.amountPaidChf - baseNet * scale
  } else {
    const moduleNet = (moduleLine.amountChf / positiveSum) * (positiveSum - discountAbs)
    const minShare = moduleSum > 0 ? (moduleLine.amountChf / moduleSum) * minimum : 0
    share = (moduleNet + minShare) * scale
  }

  const already = Number.isFinite(opts.alreadyRefundedChf) ? Math.max(0, opts.alreadyRefundedChf ?? 0) : 0
  const remaining = Math.max(0, opts.amountPaidChf - already)
  const amount = roundSicChf(Math.min(Math.max(0, share), remaining))
  return amount >= 0.01 ? amount : null
}

export function sicChfToStripeCents(chf: number): number {
  return Math.round(chf * 100)
}
