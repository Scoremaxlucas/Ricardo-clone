import {
  getSicModule,
  normalizeSicModuleIds,
  roundSicChf,
  SIC_BASE_FEE_CHF,
  SIC_BUNDLE_ALL_MODULES_CHF,
  SIC_CURRENCY,
  SIC_MIN_CHARGE_CHF,
  SIC_MODULES,
  SIC_RENEWAL_FEE_CHF,
  type SicModuleId,
} from '@/lib/sic/modules'

export type SicOrderLine = {
  /**
   * `minimum`: Aufschlag auf den Stripe-Mindestbetrag, damit angezeigt = belastet.
   * `renewal`: Verlängerung der Gültigkeit mit frischem Betreibungsauszug.
   */
  kind: 'base' | 'module' | 'discount' | 'minimum' | 'renewal'
  moduleId?: SicModuleId
  label: string
  amountChf: number
}

export type SicOrderQuote = {
  currency: typeof SIC_CURRENCY
  includeBaseFee: boolean
  isRenewal: boolean
  moduleIds: SicModuleId[]
  lines: SicOrderLine[]
  totalChf: number
}

/**
 * Berechnet den Preis einer Bestellung.
 * @param includeBaseFee true bei Erst-Erstellung (neues Zertifikat), false bei Nachkauf weiterer Module.
 * @param moduleIds gewählte Module (roh; wird normalisiert/dedupliziert).
 * @param isRenewal Verlängerung statt Neukauf — schliesst Basisgebühr aus.
 */
export function quoteSicOrder(opts: {
  includeBaseFee: boolean
  moduleIds: unknown
  isRenewal?: boolean
}): SicOrderQuote {
  const moduleIds = normalizeSicModuleIds(opts.moduleIds)
  const isRenewal = opts.isRenewal === true
  const lines: SicOrderLine[] = []

  if (isRenewal) {
    lines.push({ kind: 'renewal', label: 'Verlängerung · 3 Monate', amountChf: SIC_RENEWAL_FEE_CHF })
  } else if (opts.includeBaseFee) {
    lines.push({ kind: 'base', label: 'Basis · Zertifikat', amountChf: SIC_BASE_FEE_CHF })
  }

  for (const id of moduleIds) {
    const m = getSicModule(id)
    lines.push({ kind: 'module', moduleId: id, label: m.title, amountChf: m.priceChf })
  }

  // Komplett-Paket: Basis + alle 4 Module → Bundle-Rabatt (nur bei Erst-Erstellung).
  const isBundle = !isRenewal && opts.includeBaseFee && moduleIds.length === SIC_MODULES.length
  if (isBundle) {
    const beforeDiscount = lines.reduce((sum, l) => sum + l.amountChf, 0)
    const discount = beforeDiscount - SIC_BUNDLE_ALL_MODULES_CHF
    if (discount > 0) {
      lines.push({ kind: 'discount', label: 'Komplett-Paket Rabatt', amountChf: -discount })
    }
  }

  let totalChf = roundSicChf(lines.reduce((sum, l) => sum + l.amountChf, 0))

  // Stripe lehnt Zahlungen unter dem Mindestbetrag ab. Differenz als eigene Zeile
  // ausweisen, damit der angezeigte Betrag dem belasteten entspricht.
  if (totalChf > 0 && totalChf < SIC_MIN_CHARGE_CHF) {
    lines.push({
      kind: 'minimum',
      label: 'Mindestbetrag Zahlung',
      amountChf: roundSicChf(SIC_MIN_CHARGE_CHF - totalChf),
    })
    totalChf = SIC_MIN_CHARGE_CHF
  }

  return {
    currency: SIC_CURRENCY,
    includeBaseFee: !isRenewal && opts.includeBaseFee,
    isRenewal,
    moduleIds,
    lines,
    totalChf,
  }
}
