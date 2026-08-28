import { sicPaths, sicUrl } from '@/lib/sic/config'
import { buildSicMagicLinkUrl, safeSicNextPath } from '@/lib/sic/magic-link'
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
  it('omits next when the destination is the workspace', () => {
    const url = buildSicMagicLinkUrl('tok_abc')
    expect(url).toContain('token=tok_abc')
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

describe('renew CTA', () => {
  it('is a stable path, not a 30-minute token', () => {
    expect(sicUrl(sicPaths.renew)).toMatch(/\/sic\/verlaengern$/)
    expect(sicUrl(sicPaths.renew)).not.toContain('token')
  })
})
