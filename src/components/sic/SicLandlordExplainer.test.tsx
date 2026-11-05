import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SicLandlordExplainer } from '@/components/sic/SicLandlordExplainer'
import { SIC_UNSEALED_NOTE } from '@/lib/sic/modules'

describe('SicLandlordExplainer', () => {
  it('renders the five landlord facts beside a sealed certificate', () => {
    const html = renderToStaticMarkup(
      <SicLandlordExplainer completenessLabel="2 von 4 Angaben geprüft" sealed />
    )
    expect(html).toContain('Für Vermieterinnen und Vermieter')
    expect(html).toContain('Was «2 von 4 Angaben geprüft» bedeutet')
    expect(html).toContain('3×-Regel')
    expect(html).toContain('Gültigkeit')
    expect(html).toContain('/sic/vermieter')
    expect(html).toContain('/sic/agb')
    expect(html).toContain('/sic/datenschutz')
    expect(html).not.toContain(SIC_UNSEALED_NOTE)
    expect(html).not.toContain('stützen')
  })

  it('explains the missing seal', () => {
    const html = renderToStaticMarkup(
      <SicLandlordExplainer completenessLabel="1 von 4 Angaben geprüft" sealed={false} />
    )
    expect(html).toContain(SIC_UNSEALED_NOTE)
    expect(html).toContain('Was «1 von 4 Angaben geprüft» bedeutet')
  })
})
