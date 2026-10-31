import { sicPresentedModules } from '@/lib/sic/dossier'
import { describe, expect, it } from 'vitest'

const NOW = new Date(Date.UTC(2026, 9, 31))
const LATER = new Date(Date.UTC(2026, 11, 1))
const EARLIER = new Date(Date.UTC(2026, 9, 1))

const modules = [
  {
    moduleKind: 'BONITAET',
    status: 'PENDING_DOCS' as const,
    verifiedFacts: { proceedings: 'none' },
  },
  {
    moduleKind: 'AUFENTHALT',
    status: 'VERIFIED' as const,
    verifiedFacts: { documentType: 'ch_pass' },
  },
  { moduleKind: 'ARBEIT_EINKOMMEN', status: 'PENDING_DOCS' as const, verifiedFacts: null },
]

describe('sicPresentedModules', () => {
  it('zeigt bei frühzeitiger Verlängerung die bisher geprüften Werte, solange das Zertifikat gilt', () => {
    const shown = sicPresentedModules(modules, { status: 'ACTIVE', expiresAt: LATER }, NOW)
    expect(shown.find(m => m.moduleKind === 'BONITAET')?.status).toBe('VERIFIED')
    expect(shown.find(m => m.moduleKind === 'ARBEIT_EINKOMMEN')?.status).toBe('PENDING_DOCS')
  })

  it('zeigt nach Ablauf oder ohne Frist nur echte Freigaben', () => {
    for (const cert of [
      { status: 'ACTIVE', expiresAt: EARLIER },
      { status: 'ACTIVE', expiresAt: null },
      { status: 'EXPIRED', expiresAt: LATER },
    ]) {
      const shown = sicPresentedModules(modules, cert, NOW)
      expect(shown.find(m => m.moduleKind === 'BONITAET')?.status).toBe('PENDING_DOCS')
    }
  })
})
