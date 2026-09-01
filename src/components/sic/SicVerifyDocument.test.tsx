import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SicVerifyDocument } from '@/components/sic/SicVerifyDocument'
import { SIC_CERT_TAGLINE } from '@/lib/sic/brand'
import { SIC_MODULE_BADGE, SIC_PLAUSIBILITY_FOOTER, SIC_SCOPE_NOTE } from '@/lib/sic/modules'
import { SIC_BRAND_NAME, SIC_ISSUER_LINE } from '@/lib/sic/config'

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
    expect(html).toContain(SIC_BRAND_NAME)
    expect(html).not.toContain('SWISS IMMO CERT')
    expect(html).not.toContain('SwissImmoCert')
    expect(html).toContain('MIETER-ZERTIFIKAT')
    expect(html).toContain('Anna Muster')
    expect(html).toContain('2 von 4 Angaben geprüft')
    expect(html).toContain(SIC_MODULE_BADGE)
    expect(html).not.toContain('VERIFIZIERT')
    expect(html).toContain(SIC_SCOPE_NOTE)
    expect(html).toContain(SIC_PLAUSIBILITY_FOOTER)
    expect(html).toContain(SIC_CERT_TAGLINE)
    expect(html).toContain(SIC_ISSUER_LINE)
    expect(html).not.toContain('Score-Max')
    expect(html).not.toContain('Online bestätigt')
    expect(html).toContain('01.08.2026')
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

  it('names revoked without leaking holder data', () => {
    const html = renderToStaticMarkup(
      <SicVerifyDocument state="revoked" code="SIC-2026-ABCDEFGH" />
    )
    expect(html).toContain('Widerrufen')
    expect(html).toContain('SIC-2026-ABCDEFGH')
    expect(html).not.toContain('Ausgestellt für')
    expect(html).not.toContain('Anna Muster')
  })

  it('names expired without leaking holder data', () => {
    const html = renderToStaticMarkup(
      <SicVerifyDocument state="expired" code="SIC-2026-ABCDEFGH" />
    )
    expect(html).toContain('Abgelaufen')
    expect(html).toContain('SIC-2026-ABCDEFGH')
    expect(html).not.toContain('Ausgestellt für')
    expect(html).not.toContain('Anna Muster')
  })

  it('uses Du-form on the rate-limit state', () => {
    const html = renderToStaticMarkup(<SicVerifyDocument state="rate_limited" />)
    expect(html).toContain('versuche es später')
    expect(html).not.toContain('versuchen Sie')
  })
})
