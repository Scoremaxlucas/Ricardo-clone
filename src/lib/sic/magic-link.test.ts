import { sicPaths, sicUrl } from '@/lib/sic/config'
import { buildSicMagicLinkUrl, safeSicNextPath, sicMagicLinkStatus } from '@/lib/sic/magic-link'
import { describe, expect, it } from 'vitest'

describe('safeSicNextPath', () => {
  it('allows workspace and renew, nothing else', () => {
    expect(safeSicNextPath(sicPaths.renew)).toBe(sicPaths.renew)
    expect(safeSicNextPath(sicPaths.certificateWorkspace)).toBe(sicPaths.certificateWorkspace)
    expect(safeSicNextPath('https://evil.example/phish')).toBe(sicPaths.certificateWorkspace)
    expect(safeSicNextPath('//evil.example')).toBe(sicPaths.certificateWorkspace)
    expect(safeSicNextPath('/sic/verlaengern/../admin')).toBe(sicPaths.certificateWorkspace)
    expect(safeSicNextPath('/api/sic/checkout')).toBe(sicPaths.certificateWorkspace)
  })
})

describe('buildSicMagicLinkUrl', () => {
  it('points at the confirm page, not the consume endpoint', () => {
    const url = buildSicMagicLinkUrl('tok_abc')
    expect(url).toContain(sicPaths.loginConfirm)
    expect(url).toContain('token=tok_abc')
    expect(url).not.toContain('/api/sic/auth/callback')
    expect(url).not.toContain('next=')
  })

  it('keeps renew as next and ignores injected hosts', () => {
    const url = buildSicMagicLinkUrl('tok_abc', sicPaths.renew)
    expect(url).toContain(`next=${encodeURIComponent(sicPaths.renew)}`)
    const poisoned = buildSicMagicLinkUrl('tok_abc', 'https://evil.example')
    expect(poisoned).not.toContain('evil')
    expect(poisoned).not.toContain('next=')
  })
})

describe('sicMagicLinkStatus', () => {
  const future = new Date('2026-09-03T12:00:00.000Z')
  const now = new Date('2026-09-03T11:00:00.000Z')

  it('is valid only while unconsumed and unexpired', () => {
    expect(sicMagicLinkStatus({ consumedAt: null, expiresAt: future }, now)).toBe('valid')
    expect(sicMagicLinkStatus({ consumedAt: now, expiresAt: future }, now)).toBe('invalid')
    expect(sicMagicLinkStatus({ consumedAt: null, expiresAt: now }, now)).toBe('invalid')
    expect(sicMagicLinkStatus(null, now)).toBe('invalid')
  })
})

describe('renew CTA', () => {
  it('is a stable path, not a 30-minute token', () => {
    expect(sicUrl(sicPaths.renew)).toMatch(/\/sic\/verlaengern$/)
    expect(sicUrl(sicPaths.renew)).not.toContain('token')
  })
})
