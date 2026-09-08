import { describe, expect, it } from 'vitest'
import {
  SIC_OFFER_TERMS,
  SIC_PREP_ITEMS,
  SIC_PRODUCT_LINE,
  SIC_REVIEWER,
  SIC_TODAY_CLOSING,
  SIC_TODAY_SCENES,
  SIC_TRUST_FACTS,
} from '@/lib/sic/landing-copy'

describe('SIC landing offer copy', () => {
  it('names the product, the country and that tenants need no subscription', () => {
    expect(SIC_PRODUCT_LINE).toMatch(/Mieter-Zertifikat/)
    expect(SIC_PRODUCT_LINE).toMatch(/Schweiz/)
    expect(SIC_PRODUCT_LINE).toMatch(/kein Pflicht-Abo/i)
  })

  it('states price, one-off terms, validity and renewal on the landing', () => {
    expect(SIC_OFFER_TERMS).toMatch(/kein Abo/i)
    expect(SIC_OFFER_TERMS).toMatch(/Betreibungsauszug/)
    expect(SIC_OFFER_TERMS).toMatch(/Verlängerung|Kostenlos/)
  })

  it('lists the four things the tenant must obtain', () => {
    expect(SIC_PREP_ITEMS).toHaveLength(4)
    expect(SIC_PREP_ITEMS.join(' ')).toMatch(/Betreibungsauszug/)
    expect(SIC_PREP_ITEMS.join(' ')).toMatch(/Ausweis/)
    expect(SIC_PREP_ITEMS.join(' ')).toMatch(/Arbeitgeber/)
    expect(SIC_PREP_ITEMS.join(' ')).toMatch(/Vermieter/)
  })

  it('names the actual market situation, not a strawman about self-declaration', () => {
    const blob = SIC_TODAY_SCENES.join(' ')
    // Grund, warum es das braucht: Vermieter sichten schnell, viele Bewerbungen.
    expect(blob).toMatch(/Bewerbungen/i)
    expect(blob).toMatch(/Minuten/i)
    // Was das Zertifikat konkret leistet: ein Dokument statt viele Anhänge.
    expect(blob).toMatch(/Zertifikat/i)
    expect(blob).toMatch(/QR/i)
    // Keine falschen Behauptungen über andere Bewerber.
    expect(blob).not.toMatch(/Selbstauskunft/i)
    // Kein wackliger Portal-Formular-Pitch als Kern-Argument.
    expect(blob).not.toMatch(/Portal-Formular/i)
  })

  it('closes without claiming other applicants are pure self-declaration', () => {
    expect(SIC_TODAY_CLOSING).toMatch(/tatsächlich vorgelegt/i)
    expect(SIC_TODAY_CLOSING).not.toMatch(/Selbstauskunft/i)
    expect(SIC_TODAY_CLOSING).not.toMatch(/garantiert|versprechen/i)
  })

  it('names a real reviewer without inventing testimonials', () => {
    expect(SIC_REVIEWER.name).toBe('Lucas Rodrigues')
    expect(SIC_REVIEWER.role).toBe('Prüfung')
    const blob = SIC_TRUST_FACTS.map(f => `${f.title} ${f.body}`).join(' ')
    expect(blob).toMatch(/Mensch/)
    expect(blob).toMatch(/behördliche Auskunft|amtliche Auskunft/)
    expect(blob).toMatch(/Portal/)
    expect(blob).not.toMatch(/Lara|Marco|Sofie/)
    expect(blob).not.toMatch(/Wohnungszusage versprechen|garantiert/)
  })
})
