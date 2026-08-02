import { prisma } from '@/lib/prisma'
import { decryptPdfFromStorageBestEffort } from '@/lib/rental/pdf-crypto'
import { requireSicAdmin } from '@/lib/sic/admin'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Lädt ein hochgeladenes Nachweis-Dokument, entschlüsselt es und liefert es inline (nur Admin). */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireSicAdmin()
  if (!admin) return new NextResponse('Zugriff verweigert', { status: 403 })

  const { id } = await ctx.params
  const doc = await prisma.sicDocument.findUnique({ where: { id } })
  if (!doc) return new NextResponse('Nicht gefunden', { status: 404 })

  const res = await fetch(doc.blobUrl)
  if (!res.ok) return new NextResponse('Datei nicht abrufbar', { status: 502 })

  const raw = Buffer.from(await res.arrayBuffer())
  const { buffer } = decryptPdfFromStorageBestEffort(raw)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': doc.contentType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName || 'nachweis')}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
