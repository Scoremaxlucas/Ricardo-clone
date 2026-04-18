import { describe, expect, it } from 'vitest'
import { matchingApiImportBodySchema } from './matching-api-import-schema'

const minimalItem = {
  title: 'Objekt A',
  zip: '8001',
  city: 'Zürich',
  canton: 'zh',
  rooms: 3,
  rentPerMonth: 2000,
  availableFrom: new Date('2026-01-15'),
  status: 'draft' as const,
}

describe('matchingApiImportBodySchema', () => {
  it('rejects unknown root keys (strict)', () => {
    const r = matchingApiImportBodySchema.safeParse({
      items: [minimalItem],
      extraKey: true,
    })
    expect(r.success).toBe(false)
  })

  it('rejects empty items array', () => {
    const r = matchingApiImportBodySchema.safeParse({ items: [] })
    expect(r.success).toBe(false)
  })

  it('accepts a single valid item', () => {
    const r = matchingApiImportBodySchema.safeParse({ items: [minimalItem] })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.items).toHaveLength(1)
      expect(r.data.items[0].canton).toBe('ZH')
    }
  })
})
