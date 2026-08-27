import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SicVerifyDocument } from '@/components/sic/SicVerifyDocument'
import { SIC_CERT_TAGLINE } from '@/lib/sic/brand'
import { SIC_SCOPE_NOTE } from '@/lib/sic/modules'

describe('SicVerifyDocument', () => {
  it('renders the certificate hierarchy for a valid code', () => {
    const html = renderToStaticMarkup(
      <SicVerifyDocument
        state="valid"
        certificateCode="SIC-2026-ABCDEFGH"
        holderName="Anna Muster"
        issuedAt={new Date('2026-08-01')}
        expiresAt={new Date('2026-11-01')}
        completenessLabel="2 von 4 Angaben geprüft"
        modules={[
          {
            id: 'BONITAET',
            title: 'Betreibungsauszug',
            lines: ['Keine offenen Betreibungen'],
          },
        ]}
      />
    )
    expect(html).toContain('SWISS IMMO CERT')
    expect(html).toContain('MIETER-ZERTIFIKAT')
    expect(html).toContain('Anna Muster')
    expect(html).toContain('2 von 4 Angaben geprüft')
    expect(html).toContain('VERIFIZIERT')
    expect(html).toContain(SIC_SCOPE_NOTE)
    expect(html).toContain(SIC_CERT_TAGLINE)
    expect(html).not.toContain('Vertrauenswürdig')
    expect(html).toContain('Gültiges Zertifikat')
    expect(html).not.toContain('lucide')
  })

  it('does not leak holder data when the code is unknown', () => {
    const html = renderToStaticMarkup(
      <SicVerifyDocument state="unknown" code="SIC-2026-ABCDEFGH" />
    )
    expect(html).toContain('Kein Zertifikat gefunden')
    expect(html).toContain('SIC-2026-ABCDEFGH')
    expect(html).not.toContain('Ausgestellt für')
    expect(html).not.toContain('Gültiges Zertifikat')
  })

  it('keeps not-ready quiet without a valid badge', () => {
    const html = renderToStaticMarkup(<SicVerifyDocument state="not_ready" />)
    expect(html).toContain('Kein gültiges Zertifikat')
    expect(html).not.toContain('Ausgestellt für')
    expect(html).not.toContain('Online bestätigt')
  })
})
