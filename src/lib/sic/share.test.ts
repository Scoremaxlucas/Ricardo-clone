import { SIC_BRAND_NAME, sicVerifyUrl } from '@/lib/sic/config'
import {
  sicVerifyMailtoHref,
  sicVerifyShareText,
  sicVerifyWhatsAppHref,
} from '@/lib/sic/share'
import { describe, expect, it } from 'vitest'

describe('sic verify share', () => {
  const code = 'SIC-2026-ABCDEFGH'
  const url = sicVerifyUrl(code)

  it('puts the verify URL in copy text, mail and WhatsApp', () => {
    expect(sicVerifyShareText(code)).toBe(`${SIC_BRAND_NAME} ${code}\n${url}`)
    expect(sicVerifyMailtoHref(code)).toContain('mailto:?')
    expect(sicVerifyMailtoHref(code)).toContain(encodeURIComponent(url))
    expect(sicVerifyWhatsAppHref(code)).toContain('https://wa.me/?text=')
    expect(sicVerifyWhatsAppHref(code)).toContain(encodeURIComponent(url))
  })
})
