import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { requireSicAdmin } from '@/lib/sic/admin'
import { readSicBlobBytes } from '@/lib/sic/blob-read'
import { decryptSicDocument } from '@/lib/sic/document-crypto'
import { sicLog } from '@/lib/sic/log'
import { isSicModuleId } from '@/lib/sic/modules'
import { parseSicDocumentFacts } from '@/lib/sic/parse-document'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Obergrenze für die Anthropic-Vorbefüllung. Uploads sind bereits auf 8 MB
 * begrenzt (siehe `/api/sic/documents`); wir setzen hier einen zweiten Riegel,
 * falls ein Admin-Account jemals per Direktzugriff eine grössere Blob-URL
 * einreicht. Base64-Overhead ~33 %, deshalb effektiv ca. 8 MB Rohbytes.
 */
const PREFILL_MAX_BYTES = 8 * 1024 * 1024

/**
 * Liest die Prüffelder aus dem hochgeladenen Nachweis vor. Reine Vorbefüllung —
 * der Prüfer korrigiert und bestätigt, freigegeben wird nichts automatisch.
 */
export async function POST(req: NextRequest) {
  const admin = await requireSicAdmin()
  if (!admin) return NextResponse.json({ ok: false, message: 'Zugriff verweigert' }, { status: 403 })

  // Rate-Limit gegen versehentliche Loop-Klicks oder kompromittierte Sessions,
  // die sonst grosse Anthropic-Rechnungen (LLM-Aufrufe pro Klick) verursachen.
  const rl = await checkRateLimit({
    identifier: `sic-admin-prefill:${admin.userId}`,
    limit: 60,
    window: 3600,
  })
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, message: 'Zu viele Vorbefüll-Aufrufe. Bitte kurz warten.' },
      { status: 429 }
    )
  }

  let body: { documentId?: string; moduleKind?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, message: 'Ungültige Anfrage.' }, { status: 400 })
  }

  const { documentId, moduleKind } = body
  if (!documentId || !isSicModuleId(moduleKind)) {
    return NextResponse.json({ ok: false, message: 'Ungültige Parameter.' }, { status: 400 })
  }

  const doc = await prisma.sicDocument.findUnique({ where: { id: documentId } })
  if (!doc || doc.moduleKind !== moduleKind) {
    return NextResponse.json({ ok: false, message: 'Nachweis nicht gefunden.' }, { status: 404 })
  }

  const raw = await readSicBlobBytes(doc.blobUrl)
  if (!raw) {
    return NextResponse.json({ ok: false, message: 'Datei nicht abrufbar.' }, { status: 502 })
  }
  const { buffer } = decryptSicDocument(raw)

  if (buffer.byteLength > PREFILL_MAX_BYTES) {
    sicLog('sic.admin.prefill_too_large', {
      documentId,
      moduleKind,
      sizeBytes: buffer.byteLength,
    })
    return NextResponse.json(
      {
        ok: false,
        message: 'Nachweis zu gross zum Vorbefüllen — Werte bitte manuell erfassen.',
      },
      { status: 413 }
    )
  }

  const outcome = await parseSicDocumentFacts({
    moduleId: moduleKind,
    fileBase64: buffer.toString('base64'),
    mediaType: doc.contentType || 'application/pdf',
  })

  if (!outcome.ok) {
    sicLog('sic.admin.prefill_failed', { documentId, moduleKind, error: outcome.error })
    const message =
      outcome.error === 'not_configured' ?
        'Automatisches Auslesen ist nicht konfiguriert — Werte bitte manuell erfassen.'
      : 'Das Dokument konnte nicht ausgelesen werden — Werte bitte manuell erfassen.'
    return NextResponse.json({ ok: false, message }, { status: 422 })
  }

  sicLog('sic.admin.prefill', {
    documentId,
    moduleKind,
    fields: Object.keys(outcome.facts).length,
    warnings: outcome.warnings.length,
  })

  return NextResponse.json({ ok: true, facts: outcome.facts, warnings: outcome.warnings })
}
