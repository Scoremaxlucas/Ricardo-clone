import { prisma } from '@/lib/prisma'
import { certificateVerifyQrDataUrl } from '@/lib/certificate/qrDataUrl'
import { SicCertificatePdfDocument } from '@/lib/sic/CertificatePdf'
import { sicVerifyUrl } from '@/lib/sic/config'
import { isSicLandlordPdfReady, joinHolderName, verifiedModuleLineItems } from '@/lib/sic/dossier'
import { recordSicEventOnce } from '@/lib/sic/events'
import { SIC_SCOPE_NOTE, sicCompletenessLabel } from '@/lib/sic/modules'
import { normalizeSicCertificateCode } from '@/lib/sic/certificate-code'
import { getSicSession } from '@/lib/sic/session-cookie'
import { renderToBuffer } from '@react-pdf/renderer'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const session = getSicSession()
  if (!session) return NextResponse.json({ message: 'Nicht angemeldet' }, { status: 401 })

  const { code: raw } = await ctx.params
  const certificateCode = normalizeSicCertificateCode(raw)

  const cert = await prisma.sicCertificate.findUnique({
    where: { certificateCode },
    include: { modules: { select: { moduleKind: true, status: true, verifiedFacts: true } } },
  })
  if (!cert || cert.email !== session.email) {
    return NextResponse.json({ message: 'Nicht gefunden' }, { status: 404 })
  }

  const holderName = joinHolderName(cert.holderFirstName, cert.holderLastName)
  const landlordPdfReady = isSicLandlordPdfReady({
    holderName,
    status: cert.status,
    expiresAt: cert.expiresAt,
    modules: cert.modules,
  })
  if (!landlordPdfReady || !cert.expiresAt) {
    return NextResponse.json(
      {
        message:
          'Das PDF gibt es, sobald mindestens eine Angabe geprüft ist und dein Name auf dem Zertifikat steht.',
      },
      { status: 403 }
    )
  }

  const verifiedModules = verifiedModuleLineItems(cert.modules)
  const verifyUrl = sicVerifyUrl(cert.certificateCode)
  let qrDataUrl = ''
  try {
    qrDataUrl = await certificateVerifyQrDataUrl(verifyUrl)
  } catch (e) {
    console.error('[sic/pdf] QR', e)
  }

  const doc = (
    <SicCertificatePdfDocument
      certificateCode={cert.certificateCode}
      holderName={holderName}
      email={cert.email}
      issuedAt={cert.certifiedAt ?? cert.issuedAt}
      expiresAt={cert.expiresAt}
      verifiedModules={verifiedModules}
      completenessLabel={sicCompletenessLabel(verifiedModules.length)}
      scopeNote={SIC_SCOPE_NOTE}
      verifyUrl={verifyUrl}
      qrDataUrl={qrDataUrl}
    />
  )

  try {
    const buffer = await renderToBuffer(doc)
    const filename = `SwissImmoCert-${cert.certificateCode}.pdf`
    await recordSicEventOnce({
      kind: 'PDF_DOWNLOADED',
      certificateId: cert.id,
      email: cert.email,
      meta: { verifiedCount: verifiedModules.length },
    })
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    })
  } catch (e) {
    console.error('[sic/pdf]', e)
    return NextResponse.json({ message: 'PDF-Erstellung fehlgeschlagen' }, { status: 500 })
  }
}
