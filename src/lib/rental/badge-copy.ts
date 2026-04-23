import type { CreditCheckResult } from './types'

/** Kurztext für E-Mail an Vermieter */
export function creditCheckBadgeSummaryForEmail(
  result: CreditCheckResult | null,
  status: 'approved' | 'rejected' | 'pending_manual_review' | 'pending_credit_check'
): string {
  if (status === 'pending_manual_review') {
    return 'Manuelle Überprüfung läuft'
  }
  if (status === 'pending_credit_check') {
    return 'Betreibungsregisterauszug wird geprüft'
  }
  if (status === 'rejected' || !result) {
    return 'Betreibungsregisterauszug nicht akzeptiert'
  }
  if (!result.hasEntries) {
    return `Keine Einträge · Ausgestellt: ${result.issueDate} · ${result.canton}`
  }
  const cat =
    result.totalAmountCategory === 'low'
      ? 'unter CHF 1\'000'
      : result.totalAmountCategory === 'medium'
        ? 'CHF 1\'000–5\'000'
        : result.totalAmountCategory === 'high'
          ? 'über CHF 5\'000'
          : 'keine Beträge erkannt'
  return `${result.entryCount} Einträge · ${cat} · Ausgestellt: ${result.issueDate}`
}

export function categoryLabelDe(cat: CreditCheckResult['totalAmountCategory']): string {
  switch (cat) {
    case 'low':
      return 'unter CHF 1\'000'
    case 'medium':
      return 'CHF 1\'000–5\'000'
    case 'high':
      return 'über CHF 5\'000'
    default:
      return 'keine Schulden'
  }
}
