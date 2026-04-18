/** Schweizer Währungsdarstellung, z. B. CHF 2'500.— */
export function formatCHF(amount: number): string {
  return `CHF ${new Intl.NumberFormat('de-CH').format(amount)}.—`
}
