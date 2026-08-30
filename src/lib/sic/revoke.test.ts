import { describe, expect, it } from 'vitest'
import { parseSicRevokeReason } from '@/lib/sic/revoke'

describe('parseSicRevokeReason', () => {
  it('rejects short or empty notes', () => {
    expect(parseSicRevokeReason('')).toBeNull()
    expect(parseSicRevokeReason('   kurz  ')).toBeNull()
    expect(parseSicRevokeReason(null)).toBeNull()
  })
  it('accepts AGB-style reasons', () => {
    expect(parseSicRevokeReason('Gefälschte Unterlagen')).toBe('Gefälschte Unterlagen')
    expect(parseSicRevokeReason('  Fremde Unterlagen  ')).toBe('Fremde Unterlagen')
  })
})
