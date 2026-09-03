import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SicAdminReviewPreview } from '@/components/sic/SicAdminReviewPreview'

describe('SicAdminReviewPreview', () => {
  it('renders the landlord certificate with the draft line', () => {
    const html = renderToStaticMarkup(
      <SicAdminReviewPreview
        certificateCode="SIC-2026-ABCDEFGH"
        holderName="Anna Muster"
        certifiedAt="2026-08-01T00:00:00.000Z"
        expiresAt="2026-11-01T00:00:00.000Z"
        modules={[{ moduleKind: 'BONITAET', status: 'IN_REVIEW', verifiedFacts: null }]}
        draftModuleId="BONITAET"
        draftFacts={{ extractDate: '2026-06-12', office: 'Betreibungsamt Zürich' }}
      />
    )
    expect(html).toContain('Vorschau für den Vermieter')
    expect(html).toContain('Anna Muster')
    expect(html).toContain('Keine offenen Betreibungen')
    expect(html).toContain('Betreibungsamt Zürich')
    expect(html).toContain('1 von 4 Angaben geprüft')
    expect(html).toContain('STAND DER PRÜFUNG')
    expect(html).not.toContain('MIETER-ZERTIFIKAT')
    expect(html).toContain('12.09.2026')
    expect(html).not.toContain('01.11.2026')
    expect(html).not.toContain('Noch unvollständig')
  })

  it('shows the certificate chrome once Betreibung is already verified and Ausweis is drafted', () => {
    const html = renderToStaticMarkup(
      <SicAdminReviewPreview
        certificateCode="SIC-2026-ABCDEFGH"
        holderName="Anna Muster"
        certifiedAt="2026-08-01T00:00:00.000Z"
        expiresAt="2026-09-12T00:00:00.000Z"
        modules={[
          {
            moduleKind: 'BONITAET',
            status: 'VERIFIED',
            verifiedFacts: { extractDate: '2026-06-12', office: 'Betreibungsamt Zürich' },
          },
          { moduleKind: 'AUFENTHALT', status: 'IN_REVIEW', verifiedFacts: null },
        ]}
        draftModuleId="AUFENTHALT"
        draftFacts={{ documentType: 'ch_pass', validUntil: '2031-05-31' }}
      />
    )
    expect(html).toContain('MIETER-ZERTIFIKAT')
    expect(html).not.toContain('STAND DER PRÜFUNG')
    expect(html).toContain('2 von 4 Angaben geprüft')
    expect(html).toContain('Schweizer Pass')
  })

  it('names missing required facts instead of pretending the row is complete', () => {
    const html = renderToStaticMarkup(
      <SicAdminReviewPreview
        certificateCode="SIC-2026-ABCDEFGH"
        holderName={null}
        certifiedAt={null}
        expiresAt={null}
        modules={[{ moduleKind: 'BONITAET', status: 'IN_REVIEW', verifiedFacts: null }]}
        draftModuleId="BONITAET"
        draftFacts={{ extractDate: '2026-06-12' }}
      />
    )
    expect(html).toContain('Noch unvollständig')
    expect(html).toContain('Ausstellendes Betreibungsamt fehlt')
    expect(html).toContain('Ohne Namen')
  })
})
