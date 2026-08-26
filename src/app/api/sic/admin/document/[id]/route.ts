import { prisma } from '@/lib/prisma'
import { requireSicAdmin } from '@/lib/sic/admin'
import { readSicBlobBytes } from '@/lib/sic/blob-read'
import { decryptSicDocument } from '@/lib/sic/document-crypto'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Lädt ein hochgeladenes Nachweis-Dokument (nur Admin). Private Blobs + Legacy-Public. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireSicAdmin()
  if (!admin) return new NextResponse('Zugriff verweigert', { status: 403 })

  const { id } = await ctx.params
  const doc = await prisma.sicDocument.findUnique({ where: { id } })
  if (!doc) return new NextResponse('Nicht gefunden', { status: 404 })

  const raw = await readSicBlobBytes(doc.blobUrl)
  if (!raw) return new NextResponse('Datei nicht abrufbar', { status: 502 })

  const { buffer } = decryptSicDocument(raw)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': doc.contentType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName || 'nachweis')}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
