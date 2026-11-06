import { renderSicTemplatePdf } from '@/lib/sic/form-kit/render'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('SIC-Nachweisformulare', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each(['employer_confirmation', 'landlord_reference'] as const)(
    '%s passt auf eine Seite, ohne in die Fusszeile zu laufen',
    async id => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const bytes = await renderSicTemplatePdf(id, { employeeName: 'Anna Muster', tenantName: 'Anna Muster' })
      expect(Buffer.from(bytes.subarray(0, 5)).toString()).toBe('%PDF-')
      expect(warn).not.toHaveBeenCalled()
    }
  )
})
