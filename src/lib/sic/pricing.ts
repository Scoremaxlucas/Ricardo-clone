import {
  getSicModule,
  normalizeSicModuleIds,
  SIC_BASE_FEE_CHF,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_CURRENCY,
  SIC_MODULES,
  type SicModuleId,
} from '@/lib/sic/modules'

export type SicOrderLine = {
  kind: 'base' | 'module' | 'discount'
  moduleId?: SicModuleId
  label: string
  amountChf: number
}

export type SicOrderQuote = {
  currency: typeof SIC_CURRENCY
  includeBaseFee: boolean
  moduleIds: SicModuleId[]
  lines: SicOrderLine[]
  totalChf: number
}

/**
 * Berechnet den Preis einer Bestellung.
 * @param includeBaseFee true bei Erst-Erstellung (neues Zertifikat), false bei Nachkauf weiterer Module.
 * @param moduleIds gewählte Module (roh; wird normalisiert/dedupliziert).
 */
export function quoteSicOrder(opts: { includeBaseFee: boolean; moduleIds: unknown }): SicOrderQuote {
  const moduleIds = normalizeSicModuleIds(opts.moduleIds)
  const lines: SicOrderLine[] = []

  if (opts.includeBaseFee) {
    lines.push({ kind: 'base', label: 'Basis Einschreibegebühr', amountChf: SIC_BASE_FEE_CHF })
  }

  for (const id of moduleIds) {
    const m = getSicModule(id)
    lines.push({ kind: 'module', moduleId: id, label: m.title, amountChf: m.priceChf })
  }

  // Komplett-Paket: Basis + alle 4 Module → Bundle-Rabatt (nur bei Erst-Erstellung).
  const isBundle = opts.includeBaseFee && moduleIds.length === SIC_MODULES.length
  if (isBundle) {
    const beforeDiscount = lines.reduce((sum, l) => sum + l.amountChf, 0)
    const discount = beforeDiscount - SIC_BUNDLE_ALL_MODULES_CHF
    if (discount > 0) {
      lines.push({ kind: 'discount', label: 'Komplett-Paket Rabatt', amountChf: -discount })
    }
  }

  const totalChf = lines.reduce((sum, l) => sum + l.amountChf, 0)

  return {
    currency: SIC_CURRENCY,
    includeBaseFee: opts.includeBaseFee,
    moduleIds,
    lines,
    totalChf,
  }
}
