import { prisma } from '@/lib/prisma'
import { decryptPdfFromStorageBestEffort } from '@/lib/rental/pdf-crypto'
import { requireSicAdmin } from '@/lib/sic/admin'
import { sicLog } from '@/lib/sic/log'
import { get } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function loadBlobBytes(blobUrl: string): Promise<Buffer | null> {
  try {
    const result = await get(blobUrl, { access: 'private' })
    if (result?.statusCode === 200 && result.stream) {
      const chunks: Uint8Array[] = []
      const reader = result.stream.getReader()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) chunks.push(value)
      }
      return Buffer.concat(chunks.map(c => Buffer.from(c)))
    }
  } catch {
    sicLog('sic.blob.private_get_fallback', { reason: 'private_get_error' })
  }

  const headers: HeadersInit = {}
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(blobUrl, { headers })
  if (!res.ok) return null
  sicLog('sic.blob.private_get_fallback', { reason: 'public_or_token_fetch' })
  return Buffer.from(await res.arrayBuffer())
}

/** Lädt ein hochgeladenes Nachweis-Dokument (nur Admin). Private Blobs + Legacy-Public. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireSicAdmin()
  if (!admin) return new NextResponse('Zugriff verweigert', { status: 403 })

  const { id } = await ctx.params
  const doc = await prisma.sicDocument.findUnique({ where: { id } })
  if (!doc) return new NextResponse('Nicht gefunden', { status: 404 })

  const raw = await loadBlobBytes(doc.blobUrl)
  if (!raw) return new NextResponse('Datei nicht abrufbar', { status: 502 })

  const { buffer } = decryptPdfFromStorageBestEffort(raw)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': doc.contentType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName || 'nachweis')}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
