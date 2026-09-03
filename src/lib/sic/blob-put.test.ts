import { beforeEach, describe, expect, it, vi } from 'vitest'

const put = vi.fn()
vi.mock('@vercel/blob', () => ({ put: (...args: unknown[]) => put(...args) }))
vi.mock('@/lib/sic/log', () => ({ sicLog: vi.fn() }))

describe('putSicDocumentBytes', () => {
  beforeEach(() => {
    put.mockReset()
    vi.resetModules()
  })

  it('uses a private store when the put succeeds', async () => {
    put.mockResolvedValueOnce({ url: 'https://x.private.blob.vercel-storage.com/sic.bin' })
    const { putSicDocumentBytes } = await import('@/lib/sic/blob-put')
    const url = await putSicDocumentBytes('sic/a.bin', Buffer.from('cipher'))
    expect(url).toContain('private.blob')
    expect(put).toHaveBeenCalledTimes(1)
    expect(put.mock.calls[0][2]).toMatchObject({ access: 'private' })
  })

  it('falls back to a public encrypted put when private storage is unavailable', async () => {
    put
      .mockRejectedValueOnce(new Error('This store does not support private blobs'))
      .mockResolvedValueOnce({ url: 'https://public.blob.vercel-storage.com/sic.bin' })
    const { putSicDocumentBytes } = await import('@/lib/sic/blob-put')
    const url = await putSicDocumentBytes('sic/a.bin', Buffer.from('cipher'))
    expect(url).toContain('public.blob')
    expect(put).toHaveBeenCalledTimes(2)
    expect(put.mock.calls[1][2]).toMatchObject({ access: 'public' })
  })

  it('throws when both private and public puts fail', async () => {
    put.mockRejectedValue(new Error('blob down'))
    const { putSicDocumentBytes } = await import('@/lib/sic/blob-put')
    await expect(putSicDocumentBytes('sic/a.bin', Buffer.from('cipher'))).rejects.toThrow('blob down')
  })
})
