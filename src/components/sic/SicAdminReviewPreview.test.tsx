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
    expect(html).not.toContain('Noch unvollständig')
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
