import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SicLandingTrust } from '@/components/sic/SicLandingTrust'
import { SIC_OPERATOR, SIC_SUPPORT_EMAIL } from '@/lib/sic/config'

describe('SicLandingTrust', () => {
  const html = renderToStaticMarkup(<SicLandingTrust />)

  it('shows who reviews and how to reach them', () => {
    expect(html).toContain('Wer prüft')
    expect(html).toContain('Lucas Rodrigues')
    expect(html).toContain(SIC_SUPPORT_EMAIL)
    expect(html).toContain(SIC_OPERATOR.phoneDisplay)
    expect(html).toContain('mailto:')
    expect(html).toContain(SIC_OPERATOR.phoneHref)
  })

  it('does not put the GmbH on the landing trust block', () => {
    expect(html).not.toContain('Score-Max')
    expect(html).not.toContain('GmbH')
  })
})
