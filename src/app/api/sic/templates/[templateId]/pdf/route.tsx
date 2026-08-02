import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { SicTemplatePdfDocument } from '@/lib/sic/TemplatePdfs'
import { getSicTemplate, isSicTemplateId, type SicTemplateValues } from '@/lib/sic/templates'
import { getSicSession } from '@/lib/sic/session-cookie'
import { renderToBuffer } from '@react-pdf/renderer'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ templateId: string }> }) {
  const session = getSicSession()
  if (!session) {
    return NextResponse.json({ ok: false, message: 'Nicht angemeldet.' }, { status: 401 })
  }

  const rl = await checkRateLimit({ identifier: `sic-template:${session.email}`, limit: 40, window: 3600 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, message: 'Zu viele Anfragen. Bitte später erneut.' }, { status: 429 })
  }

  const { templateId: rawId } = await ctx.params
  if (!isSicTemplateId(rawId)) {
    return NextResponse.json({ ok: false, message: 'Unbekanntes Formular.' }, { status: 404 })
  }
  const template = getSicTemplate(rawId)

  let values: SicTemplateValues = {}
  try {
    const body = await req.json()
    if (body && typeof body === 'object' && body.values && typeof body.values === 'object') {
      for (const [k, v] of Object.entries(body.values as Record<string, unknown>)) {
        if (typeof v === 'string') values[k] = v.slice(0, 800)
        else if (typeof v === 'number') values[k] = String(v)
      }
    }
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const cert = await prisma.sicCertificate.findUnique({
    where: { email: session.email },
    select: {
      id: true,
      modules: { where: { moduleKind: template.moduleKind }, select: { id: true } },
    },
  })
  if (!cert) {
    return NextResponse.json({ ok: false, message: 'Kein Zertifikat gefunden.' }, { status: 404 })
  }
  if (!cert.modules[0]) {
    return NextResponse.json(
      { ok: false, message: 'Dieses Modul wurde nicht erworben — Formular nicht freigeschaltet.' },
      { status: 403 }
    )
  }

  try {
    const buffer = await renderToBuffer(<SicTemplatePdfDocument template={template} values={values} />)
    const filename = `SIC-${template.id}.pdf`
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    })
  } catch (err) {
    console.error('[sic/templates/pdf]', err)
    return NextResponse.json({ ok: false, message: 'PDF-Erstellung fehlgeschlagen.' }, { status: 500 })
  }
}
