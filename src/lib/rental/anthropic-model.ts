/**
 * Offizieller Modellname für Anthropic Messages API (Import / Admin-Ingest / Credit-Parsing).
 * Nicht verkürzen — z. B. `claude-4-20250514` ist ungültig (API-Fehler „model not found“).
 */
export const ANTHROPIC_CLAUDE_SONNET_4 = 'claude-sonnet-4-20250514' as const

/** Bekannte Tippfehler aus Env / Konfiguration auf das gültige Sonnet-4-Modell mappen. */
export function coerceAnthropicListingModel(raw: string | undefined | null): string {
  const t = raw?.trim()
  if (!t) return ANTHROPIC_CLAUDE_SONNET_4
  if (t === 'claude-4-20250514' || t === '4-20250514' || t === 'claude-sonnet-4') {
    return ANTHROPIC_CLAUDE_SONNET_4
  }
  return t
}
