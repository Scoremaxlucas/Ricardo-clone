import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SicLandlordExplainer } from '@/components/sic/SicLandlordExplainer'
import { SIC_WORKING_NOTICE } from '@/lib/sic/modules'

describe('SicLandlordExplainer', () => {
  it('renders the five landlord facts beside a sealed certificate', () => {
    const html = renderToStaticMarkup(
      <SicLandlordExplainer completenessLabel="2 von 4 Angaben geprüft" sealed />
    )
    expect(html).toContain('Für Vermieterinnen und Vermieter')
    expect(html).toContain('Was «2 von 4 Angaben geprüft» bedeutet')
    expect(html).toContain('3×-Regel')
    expect(html).toContain('Gültigkeit')
    expect(html).toContain('/sic/agb')
    expect(html).toContain('/sic/datenschutz')
    expect(html).not.toContain(SIC_WORKING_NOTICE)
    expect(html).not.toContain('stützen')
  })

  it('names the working document when the seal is missing', () => {
    const html = renderToStaticMarkup(
      <SicLandlordExplainer completenessLabel="1 von 4 Angaben geprüft" sealed={false} />
    )
    expect(html).toContain(SIC_WORKING_NOTICE)
    expect(html).toContain('Was «1 von 4 Angaben geprüft» bedeutet')
  })
})
