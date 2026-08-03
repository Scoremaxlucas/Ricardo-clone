/** Stripe Charge ist vollständig erstattet (kein Partial-Refund). */
export function isFullStripeRefund(amount: number, amountRefunded: number): boolean {
  if (!Number.isFinite(amount) || !Number.isFinite(amountRefunded)) return false
  if (amount <= 0) return false
  return amountRefunded >= amount
}

/**
 * Zeitbudget für Cron-Batch-Loops.
 * `truncated` = Budget erschöpft und letzter Batch war „voll“ (vermutlich Restzeilen).
 */
export function cronBudgetState(opts: {
  startedAtMs: number
  budgetMs: number
  lastBatchSize: number
  batchSize: number
}): { withinBudget: boolean; truncatedHint: boolean } {
  const elapsed = Date.now() - opts.startedAtMs
  const withinBudget = elapsed < opts.budgetMs
  const truncatedHint = !withinBudget && opts.lastBatchSize >= opts.batchSize
  return { withinBudget, truncatedHint }
}
