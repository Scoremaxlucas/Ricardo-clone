/**
 * Standard-Sonnet-Modell für Anthropic Messages API (Import / Ingest / Credit-Parsing).
 * IDs ändern sich bei Anthropic; bei 404 „model not found“ in Logs: hier und ggf.
 * `ANTHROPIC_INGEST_MODEL` / `ANTHROPIC_LISTING_IMPORT_MODEL` in Vercel prüfen.
 *
 * Hinweis: `claude-sonnet-4-20250514` liefert auf vielen Accounts 404 — Migration laut
 * Anthropic-Dokumentation auf Sonnet 4.5 mit Datums-Suffix.
 */
export const ANTHROPIC_CLAUDE_SONNET_4 = 'claude-sonnet-4-5-20250929' as const

/** Fallback, falls Sonnet 4.x auf dem API-Key noch nicht freigeschaltet ist. */
export const ANTHROPIC_CLAUDE_SONNET_LEGACY = 'claude-3-5-sonnet-20241022' as const

const DEPRECATED_OR_ALIAS_MODELS: Record<string, typeof ANTHROPIC_CLAUDE_SONNET_4> = {
  'claude-4-20250514': ANTHROPIC_CLAUDE_SONNET_4,
  '4-20250514': ANTHROPIC_CLAUDE_SONNET_4,
  'claude-sonnet-4': ANTHROPIC_CLAUDE_SONNET_4,
  'claude-sonnet-4-20250514': ANTHROPIC_CLAUDE_SONNET_4,
}

/** Bekannte Tippfehler / alte IDs aus Env auf das aktuelle Sonnet-Modell mappen. */
export function coerceAnthropicListingModel(raw: string | undefined | null): string {
  const t = raw?.trim()
  if (!t) return ANTHROPIC_CLAUDE_SONNET_4
  const mapped = DEPRECATED_OR_ALIAS_MODELS[t]
  if (mapped) return mapped
  return t
}

/** Reihenfolge für Ingest/Vision: primär (Env oder Default), dann 4.5, dann 3.5 — ohne Duplikate. */
export function anthropicListingModelCandidates(envModel?: string | null): string[] {
  const primary = coerceAnthropicListingModel(envModel)
  return Array.from(
    new Set([primary, ANTHROPIC_CLAUDE_SONNET_4, ANTHROPIC_CLAUDE_SONNET_LEGACY] as string[])
  )
}
